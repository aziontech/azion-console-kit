import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeAppErrorResponseAdapter } from './edge-app-error-response-adapter'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'

export const errorResponseKeys = {
  all: (edgeAppId) => {
    if (!edgeAppId) {
      // eslint-disable-next-line no-console
      console.warn('[errorResponseKeys] Invalid edgeAppId provided:', edgeAppId)
      return ['error-responses', '__invalid_edge_app_id__']
    }
    return ['error-responses', edgeAppId]
  },
  lists: (edgeAppId) => [...errorResponseKeys.all(edgeAppId), 'list'],
  details: (edgeAppId) => [...errorResponseKeys.all(edgeAppId), 'detail']
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

  #fetchList = async ({ params, edgeApplicationId }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getBaseUrl(edgeApplicationId),
      params
    })
    const { results } = data

    const body = this.adapter?.transformListEdgeAppErrorResponse?.(results) ?? results

    return body
  }

  listEdgeApplicationsErrorResponseService = async ({
    params = { page: 1, pageSize: 10 },
    edgeApplicationId
  }) => {
    await waitForPersistenceRestore()

    const queryKey = [...errorResponseKeys.lists(edgeApplicationId), params]
    const hasFilter = params?.hasFilter || false

    return await this._ensureQueryData(
      () => queryKey,
      () => this.#fetchList({ params, edgeApplicationId }),
      { persist: params.page === 1 && !params.search && !hasFilter, skipCache: hasFilter }
    )
  }

  prefetchEdgeApplicationsErrorResponseList = async (edgeApplicationId) => {
    return await this.listEdgeApplicationsErrorResponseService({ edgeApplicationId })
  }

  editEdgeApplicationErrorResponseService = async (payload, edgeApplicationId) => {
    const body = this.adapter?.transformPayloadEditEdgeAppErrorResponse?.(payload) ?? payload
    await this.http.request({
      method: 'PATCH',
      url: this.#getBaseUrl(edgeApplicationId, payload.id),
      body
    })

    // Remove list queries from cache (including IndexedDB) after editing
    this.queryClient.removeQueries({ queryKey: errorResponseKeys.all(edgeApplicationId) })

    return 'Your Error Responses has been edited'
  }
}

export const edgeAppErrorResponseService = new EdgeAppErrorResponseService()
