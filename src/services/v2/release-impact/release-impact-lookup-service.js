import { workloadService as defaultWorkloadService } from '@/services/v2/workload/workload-service'
import { environmentService as defaultEnvironmentService } from '@/services/v2/environment/environment-service'
import { buildReverseLookupByDs } from '@/templates/release-composition/build-reverse-lookup-by-ds'

const WORKLOAD_PAGE_SIZE = 100

const MAX_FANOUT_PAGES = 100

const MAX_CONCURRENT_FANOUT = 3

const FIRST_PAGE = 1

const listResponseBody = (response) => (Array.isArray(response?.body) ? response.body : [])
const listResponseCount = (response) =>
  Number.isFinite(response?.count) ? response.count : listResponseBody(response).length

/**
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
 * @param {object} [deps]
 * @param {typeof defaultWorkloadService} [deps.workloadService]
 * @param {typeof defaultEnvironmentService} [deps.environmentService]
 */
export const createReleaseImpactLookupService = ({
  workloadService = defaultWorkloadService,
  environmentService = defaultEnvironmentService
} = {}) => {
  /**
   * @param {number} count
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
   * @param {object} [options]
   * @param {import('vue').Ref<boolean>|(() => boolean)|boolean} [options.enabled]
   * @returns {Promise<{ index: object, isPartial: boolean }>}
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

export const releaseImpactLookupService = createReleaseImpactLookupService()
