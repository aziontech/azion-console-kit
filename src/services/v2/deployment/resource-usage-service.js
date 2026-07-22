import { BaseService } from '@/services/v2/base/query/baseService'

const BASE_URL = '/deployment-api/v4/resource_usage'
const MAX_PAGE_SIZE = 100

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
        resource_id: resourceIds.map(String).join(','),
        page,
        page_size: Math.min(Number(pageSize) > 0 ? Number(pageSize) : MAX_PAGE_SIZE, MAX_PAGE_SIZE)
      }
    })
    return toListResult(data)
  }

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
      { persist: true, skipCache: params?.skipCache }
    )
}

export const resourceUsageService = new ResourceUsageService()
