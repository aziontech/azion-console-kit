import { BaseService } from '@/services/v2/base/query/baseService'

// Tenant-scoped resource-usage endpoint (deployment-api). Given ONE
// `resource_type` and 1..100 resource ids, lists the deployments with an ACTIVE
// link to any of them — one row per deployment carrying the matched live
// occurrences (incl. the active `resource_version`). See docs/DEPLOYMENT-API.md
// "Resource usage" / GET /v4/resource_usage. Identity: `application` is matched
// by its external `global_id`; every other type by `resource_id`.
const BASE_URL = '/deployment-api/v4/resource_usage'
const MAX_PAGE_SIZE = 100

// V4 list envelope ({ count, results }) → the { body, count } shape every
// release-impact consumer reads (mirrors the other deployment-api list services).
const toListResult = (data) => ({
  body: Array.isArray(data?.results) ? data.results : [],
  count: Number.isFinite(data?.count) ? data.count : 0
})

export class ResourceUsageService extends BaseService {
  #fetchList = async ({
    resourceType,
    resourceIds = [],
    page = 1,
    pageSize = MAX_PAGE_SIZE
  } = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: BASE_URL,
      params: {
        resource_type: resourceType,
        // The endpoint accepts a comma-separated list (or repeated keys); a single
        // joined value keeps the query compact and DRF splits it on the comma.
        resource_id: resourceIds.map(String).join(','),
        page,
        page_size: Math.min(Number(pageSize) > 0 ? Number(pageSize) : MAX_PAGE_SIZE, MAX_PAGE_SIZE)
      }
    })
    return toListResult(data)
  }

  // Cache-aware list. Keyed by (resource_type, sorted ids, page) so distinct
  // lookups never collide and a reopen reuses the cache.
  listResourceUsage = (params = {}) =>
    this.useEnsureQueryData(
      [
        'deployment-api',
        'resource_usage',
        'list',
        params?.resourceType ?? null,
        [...(params?.resourceIds ?? [])].map(String).sort(),
        params?.page ?? 1
      ],
      () => this.#fetchList(params),
      { persist: true }
    )
}

export const resourceUsageService = new ResourceUsageService()
