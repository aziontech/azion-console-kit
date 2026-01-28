import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeAppErrorResponseAdapter } from './edge-app-error-response-adapter'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

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

    const queryKey = queryKeys.edgeApp.errorResponse.list(edgeApplicationId, params)
    const skipCache = params?.hasFilter || params?.skipCache || params?.search

    return await this.useEnsureQueryData(
      queryKey,
      () => this.#fetchList({ params, edgeApplicationId }),
      { persist: false, skipCache }
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
    this.queryClient.removeQueries({
      queryKey: queryKeys.edgeApp.errorResponse.all(edgeApplicationId)
    })

    return 'Your Error Responses has been edited'
  }
}

export const edgeAppErrorResponseService = new EdgeAppErrorResponseService()
