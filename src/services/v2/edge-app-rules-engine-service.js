export class RulesEngineService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_application/applications'
  }

  getUrl(edgeApplicationId, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/rules${suffix}`
  }

  async listRulesEngine({
    edgeApplicationId,
    fields = '',
    search = '',
    ordering = '',
    page = 1,
    pageSize = 100
  }) {
    const params = { fields, search, ordering, page, pageSize }
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId),
      params
    })

    const { results, count } = data
    const transformedData = this.adapter?.transformListRulesEngine?.(results) ?? results

    return {
      count,
      body: transformedData
    }
  }

  async createRulesEngine(payload) {
    const { edgeApplicationId } = payload
    const bodyRequest = this.adapter?.transformCreateRulesEngine?.(payload)

    const { data: response } = await this.http.request({
      method: 'POST',
      url: this.getUrl(edgeApplicationId),
      body: bodyRequest
    })

    return {
      feedback: 'Rule successfully created',
      id: response.data?.id
    }
  }

  async loadRulesEngine({ edgeApplicationId, id }) {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId, `/${id}`)
    })

    return this.adapter?.transformLoadRulesEngine?.(data) ?? data
  }

  async editRulesEngine({ edgeApplicationId, payload, reorder = false }) {
    const bodyRequest = this.adapter?.transformEditRulesEngine?.(payload, reorder)

    await this.http.request({
      method: 'PATCH',
      url: this.getUrl(edgeApplicationId, `/${payload.id}`),
      body: bodyRequest
    })

    return 'Rule successfully updated'
  }

  async deleteRulesEngine({ edgeApplicationId, ruleId }) {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, `/${ruleId}`)
    })

    return 'Rule successfully deleted'
  }

  async reorderRulesEngine(newOrderData, edgeApplicationId) {
    const bodyRequest = this.adapter?.transformReorderRulesEngine?.(newOrderData)

    await this.http.request({
      method: 'PUT',
      url: this.getUrl(edgeApplicationId, '/order'),
      body: bodyRequest
    })

    return 'Rules Engine successfully ordered'
  }
}
