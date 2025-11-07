import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeAppErrorResponseAdapter } from './edge-app-error-response-adapter'

const CONSTANTS = {
  CACHE_KEY: 'error-responses-list',
  MESSAGES: {
    EDIT_SUCCESS: 'Your Error Responses has been edited'
  }
}

const CACHE_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
  staleTime: 10 * 60 * 1000, // 10 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  meta: {
    persist: true
  }
}

export class EdgeAppErrorResponseService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeAppErrorResponseAdapter
    this.baseURL = 'v4/workspace/applications'
  }

  #getBaseUrl(edgeApplicationId, id) {
    return `${this.baseURL}/${edgeApplicationId}/error_responses${id ? `/${id}` : ''}`
  }

  async invalidateListCache(edgeApplicationId) {
    await this.queryClient.removeQueries({
      predicate: (query) => {
        const queryKey = query.queryKey
        return (
          queryKey &&
          Array.isArray(queryKey) &&
          queryKey[0] === this.cacheType.GLOBAL &&
          queryKey.includes(CONSTANTS.CACHE_KEY) &&
          queryKey.includes(`edgeAppId=${edgeApplicationId}`)
        )
      }
    })
  }

  listEdgeApplicationsErrorResponseService = async ({ params, edgeApplicationId }) => {
    return this.queryAsync({
      key: [CONSTANTS.CACHE_KEY, `edgeAppId=${edgeApplicationId}`, params],
      cache: this.cacheType.GLOBAL,
      queryFn: async () => {
        const { data } = await this.http.request({
          method: 'GET',
          url: this.#getBaseUrl(edgeApplicationId),
          params
        })
        const { results } = data

        const body = this.adapter?.transformListEdgeAppErrorResponse?.(results) ?? results

        return body
      },
      ...CACHE_OPTIONS
    })
  }

  editEdgeApplicationErrorResponseService = async (payload, edgeApplicationId) => {
    const body = this.adapter?.transformPayloadEditEdgeAppErrorResponse?.(payload) ?? payload
    await this.http.request({
      method: 'PATCH',
      url: this.#getBaseUrl(edgeApplicationId, payload.id),
      body
    })

    await this.invalidateListCache(edgeApplicationId)

    return CONSTANTS.MESSAGES.EDIT_SUCCESS
  }
}

export const edgeAppErrorResponseService = new EdgeAppErrorResponseService()
