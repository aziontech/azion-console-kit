import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeAppErrorResponseAdapter } from './edge-app-error-response-adapter'

export class EdgeAppErrorResponseService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeAppErrorResponseAdapter
    this.baseURL = 'v4/workspace/applications'
  }

  #getBaseUrl(edgeApplicationId, id) {
    return `${this.baseURL}/${edgeApplicationId}/error_responses${id ? `/${id}` : ''}`
  }

  listEdgeApplicationsErrorResponseService = async ({ params, edgeApplicationId }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getBaseUrl(edgeApplicationId),
      params
    })
    const { results } = data

    const body = this.adapter?.transformListEdgeAppErrorResponse?.(results) ?? results

    return body
  }

  editEdgeApplicationErrorResponseService = async (payload, edgeApplicationId) => {
    const body = this.adapter?.transformPayloadEditEdgeAppErrorResponse?.(payload) ?? payload
    await this.http.request({
      method: 'PATCH',
      url: this.#getBaseUrl(edgeApplicationId, payload.id),
      body
    })

    return 'Your Error Responses has been edited'
  }
}

export const edgeAppErrorResponseService = new EdgeAppErrorResponseService()
