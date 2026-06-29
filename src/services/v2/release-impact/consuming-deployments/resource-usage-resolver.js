/**
 * HOP 1 strategy — `resourceUsageResolver` (the `resource-usage` endpoint).
 *
 * The strategy that was deferred (tasks.md D1) until the tenant-scoped
 * `GET /v4/resource_usage` was delivered. It asks the deployment-api directly
 * "which deployments have an ACTIVE link to these resources, and at what
 * version?" — one authoritative call per `resource_type` (the endpoint is
 * single-type, 1..100 ids) — instead of the fan-out's list-DS + scan-each-active-
 * release. Produces the SAME `ConsumingDeploymentsResult` contract so
 * `selectResolver()` swaps it for `fanoutResolver` without touching any caller
 * (Liskov; Property 3 in the contract spec runs against both).
 *
 * Match rule (req 1.5), encoded once in `matchFieldFor`: an `application` ref is
 * matched by `global_id`, every other type by `resource_id`. Dependencies are a
 * factory argument (services-as-args) so this is unit-testable without IO and
 * without a Vue context. Only the tenant resource-usage service is used.
 *
 * @typedef {import('./contract').ResolveConsumingDeployments} ResolveConsumingDeployments
 * @typedef {import('./contract').ResourceRef} ResourceRef
 */

import { resourceUsageService as defaultResourceUsageService } from '@/services/v2/deployment/resource-usage-service'
import { emptyResult, matchFieldFor, normalizeResources, resourceKey } from './contract'

const sameId = (left, right) => left != null && right != null && String(left) === String(right)

// A resource_usage row resource carries the active version in `resource_version`
// (fall back to the other shapes the API has used so the match always pins a real id).
const rowResourceVersion = (rowResource) =>
  rowResource?.resource_version ??
  rowResource?.version_id ??
  rowResource?.resource_version_id ??
  null

// Does a resource_usage row resource match the requested ref? `application` by
// `global_id`, others by `resource_id` (req 1.5) — the same rule as the fan-out.
const matchesRow = (rowResource, ref) =>
  rowResource?.resource_type === ref.resource_type &&
  sameId(rowResource?.[matchFieldFor(ref)], ref.resource_id)

/**
 * Build the resource-usage resolver over the given tenant service.
 *
 * @param {object} [deps]
 * @param {typeof defaultResourceUsageService} [deps.resourceUsageService]
 * @returns {ResolveConsumingDeployments}
 */
export const createResourceUsageResolver = ({
  resourceUsageService = defaultResourceUsageService
} = {}) => {
  /** @type {ResolveConsumingDeployments} */
  return async (resources) => {
    const refs = normalizeResources(resources)
    if (refs.length === 0) return emptyResult()

    // The endpoint is single-type: group refs by type and query once per type.
    const refsByType = new Map()
    for (const ref of refs) {
      const list = refsByType.get(ref.resource_type) ?? []
      list.push(ref)
      refsByType.set(ref.resource_type, list)
    }

    // Independent per-type fan-out: one failed type contributes no match, never
    // rejects (req 1.6) and never blocks the others.
    const settled = await Promise.allSettled(
      [...refsByType.entries()].map(async ([resourceType, typeRefs]) => ({
        typeRefs,
        response: await resourceUsageService.listResourceUsage({
          resourceType,
          resourceIds: typeRefs.map((ref) => ref.resource_id)
        })
      }))
    )

    // Accumulate across the type-calls; a DS matched by more than one type merges
    // its versions into a single entry (de-duplicated by deploymentId, req 1.7).
    const versionsByDs = new Map()
    const matchedByDeployment = new Map()

    for (const outcome of settled) {
      if (outcome.status !== 'fulfilled') continue
      const { typeRefs, response } = outcome.value
      const rows = Array.isArray(response?.body) ? response.body : []

      for (const row of rows) {
        const dsId = row?.deployment_id
        if (dsId == null) continue
        const rowResources = Array.isArray(row.resources) ? row.resources : []

        for (const ref of typeRefs) {
          const hit = rowResources.find((rowResource) => matchesRow(rowResource, ref))
          if (!hit) continue

          const versions = versionsByDs.get(dsId) ?? {}
          versions[resourceKey(ref)] = rowResourceVersion(hit)
          versionsByDs.set(dsId, versions)

          const matched = matchedByDeployment.get(dsId) ?? []
          if (!matched.some((entry) => resourceKey(entry) === resourceKey(ref))) {
            matched.push(ref)
          }
          matchedByDeployment.set(dsId, matched)
        }
      }
    }

    const deployments = [...versionsByDs.entries()].map(
      ([deploymentId, activeVersionByResource]) => ({ deploymentId, activeVersionByResource })
    )

    return { deployments, matchedByDeployment }
  }
}

/**
 * Production singleton wired to the real tenant `resourceUsageService`.
 */
export const resourceUsageResolver = createResourceUsageResolver()
