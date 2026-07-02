// IO module for the release-impact layer (design §3.3): the `lookupService`
// injected into `useReleaseImpact` and the ONLY place that performs the HOP 2/3
// fetches. It composes the EXISTING tenant services — never raw fetch/axios and
// never the service-to-service reverse-lookup endpoints (req 9.2, 10.1, 10.2) —
// resolves the (paginated, cached) workloads list plus the environments list,
// then delegates the pure inversion to `buildReverseLookupByDs` (task 3.1).
//
// Boundary: this module does NOT own Vue reactivity (that is the composable's
// job). It calls the reactive `useXxxListQuery` composables only to prime/await
// the vue-query cache via their `suspense()` promise, and returns PLAIN resolved
// data (`{ index, isPartial }`). Because those composables wrap `useQuery`,
// `getReverseLookup` must be invoked from a Vue setup context — which is exactly
// where `useReleaseImpact` (task 6.1) drives it.

import { workloadService as defaultWorkloadService } from '@/services/v2/workload/workload-service'
import { environmentService as defaultEnvironmentService } from '@/services/v2/environment/environment-service'
import { buildReverseLookupByDs } from '@/templates/release-composition/build-reverse-lookup-by-ds'

// The workloads list caps at 100 items per page (design §6.2 / req 8.1). The
// first page is fetched reactively; the remainder is fanned out imperatively.
const WORKLOAD_PAGE_SIZE = 100

// Hard cap on the number of pages we fan out (page 1 + up to MAX_FANOUT_PAGES
// extra), protecting against pathological inventories. When `count` would
// require more pages than this, the index is built from what we fetched and
// `isPartial` is set so the consumer reports totals honestly (req 3.7, design
// §7.4). 100 pages * 100/page = 10k workloads covered before degrading.
const MAX_FANOUT_PAGES = 100

// Upper bound on concurrent fan-out requests: pages are processed by a small
// worker pool so we never hold more than this many `listWorkloads` calls in
// flight at once, protecting the API from a burst on large inventories.
const MAX_CONCURRENT_FANOUT = 3

const FIRST_PAGE = 1

const listResponseBody = (response) => (Array.isArray(response?.body) ? response.body : [])
const listResponseCount = (response) =>
  Number.isFinite(response?.count) ? response.count : listResponseBody(response).length

/**
 * Build the `Map<environment_id, environment_name>` HOP 3 consumes, from the
 * transformed environments list. Only `{ id, name }` are read; an environment
 * without a usable id is skipped so it never pollutes the map (req 4.1, 4.2).
 *
 * @param {{ body?: Array<{ id?: (string|number), name?: string }> }} response
 * @returns {Map<(string|number), string>}
 */
const toEnvNameById = (response) => {
  const map = new Map()
  listResponseBody(response).forEach((environment) => {
    if (environment?.id == null) return
    map.set(environment.id, environment.name ?? null)
  })
  return map
}

/**
 * Create a release-impact lookup service over the given tenant services.
 *
 * Exported as a factory so tests inject fakes (req: services by factory-arg);
 * the production singleton at the bottom of the file wires the real services.
 *
 * @param {object} [deps]
 * @param {typeof defaultWorkloadService} [deps.workloadService]
 * @param {typeof defaultEnvironmentService} [deps.environmentService]
 */
export const createReleaseImpactLookupService = ({
  workloadService = defaultWorkloadService,
  environmentService = defaultEnvironmentService
} = {}) => {
  /**
   * Fan out the workloads pages beyond the first via the cached imperative
   * `listWorkloads({ page })`, stopping at `MAX_FANOUT_PAGES`. Returns the
   * accumulated extra rows plus whether the page cap truncated the result.
   *
   * @param {number} count - The total workloads count reported by page 1.
   * @returns {Promise<{ rows: Array, isPartial: boolean }>}
   */
  const fetchRemainingWorkloads = async (count) => {
    const totalPages = Math.ceil(count / WORKLOAD_PAGE_SIZE)
    const lastPage = Math.min(totalPages, FIRST_PAGE + MAX_FANOUT_PAGES)
    const isPartial = totalPages > lastPage

    const extraPages = []
    for (let page = FIRST_PAGE + 1; page <= lastPage; page += 1) {
      extraPages.push(page)
    }

    // Independent fan-out (mirrors the active-release fan-out in
    // use-release-composition) capped at MAX_CONCURRENT_FANOUT in-flight
    // requests: a single failed page must not drop the rest.
    const rows = []
    let anyPageFailed = false
    let cursor = 0
    const worker = async () => {
      while (cursor < extraPages.length) {
        const page = extraPages[cursor++]
        try {
          const response = await workloadService.listWorkloads({
            page,
            pageSize: WORKLOAD_PAGE_SIZE,
            ordering: '-last_modified'
          })
          rows.push(...listResponseBody(response))
        } catch {
          anyPageFailed = true
        }
      }
    }
    const poolSize = Math.min(MAX_CONCURRENT_FANOUT, extraPages.length)
    await Promise.all(Array.from({ length: poolSize }, () => worker()))

    return { rows, isPartial: isPartial || anyPageFailed }
  }

  /**
   * Resolve the per-DS reverse-lookup index for the current tenant.
   *
   * 1. Sets up the reactive workloads (`pageSize: 100`) and environments list
   *    queries via the existing composables, gated by `enabled`, and awaits
   *    their first settlement through vue-query's `suspense()`.
   * 2. When the workloads `count` exceeds one page, fans out the remaining
   *    pages with the cached imperative `listWorkloads`; a hard page cap sets
   *    `isPartial`.
   * 3. Builds the `Map<id, name>` from environments and delegates the inversion
   *    to `buildReverseLookupByDs`.
   *
   * MUST run inside a Vue setup context (the `useXxxListQuery` composables wrap
   * `useQuery`); `useReleaseImpact` is the intended caller.
   *
   * @param {object} [options]
   * @param {import('vue').Ref<boolean>|(() => boolean)|boolean} [options.enabled]
   *   Gates fetching to the screen's active state (closed never fetches; reopen
   *   reuses the cache). Forwarded as-is to the list queries.
   * @returns {Promise<{ index: object, isPartial: boolean }>} `index` is the
   *   `buildReverseLookupByDs` output; `isPartial` is true when the page cap was
   *   hit or any fan-out page failed.
   */
  const getReverseLookup = async ({ enabled } = {}) => {
    const workloadsQuery = workloadService.useWorkloadsListQuery({
      enabled,
      params: { page: FIRST_PAGE, pageSize: WORKLOAD_PAGE_SIZE, ordering: '-last_modified' }
    })
    const environmentsQuery = environmentService.useEnvironmentsListQuery({ enabled })

    const [workloadsResult, environmentsResult] = await Promise.all([
      workloadsQuery.suspense(),
      environmentsQuery.suspense()
    ])

    // vue-query's suspense() resolves to the QueryObserverResult; the service
    // payload ({ body, count }) lives under `.data`.
    const workloadsFirstPage = workloadsResult?.data ?? workloadsResult
    const environmentsResponse = environmentsResult?.data ?? environmentsResult

    const firstPageRows = listResponseBody(workloadsFirstPage)
    const count = listResponseCount(workloadsFirstPage)

    let workloads = firstPageRows
    let isPartial = false

    if (count > WORKLOAD_PAGE_SIZE) {
      const { rows, isPartial: capped } = await fetchRemainingWorkloads(count)
      workloads = [...firstPageRows, ...rows]
      isPartial = capped
    }

    const envNameById = toEnvNameById(environmentsResponse)
    const index = buildReverseLookupByDs(workloads, envNameById)

    return { index, isPartial }
  }

  return { getReverseLookup }
}

/**
 * Production singleton (the default `lookupService` for `useReleaseImpact`),
 * wired to the real tenant `workloadService` + `environmentService`.
 */
export const releaseImpactLookupService = createReleaseImpactLookupService()
