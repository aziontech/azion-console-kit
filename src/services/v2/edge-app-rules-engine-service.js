export class RulesEngineService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_application/applications'
  }

  getUrl(edgeApplicationId, phase, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/${phase}${suffix}`
  }

  async listRulesEngine({
    edgeApplicationId,
    phase = 'request',
    fields = '',
    search = '',
    ordering = '',
    page = 1,
    pageSize = 100
  }) {
    const currentPhase = this.getCurrentPhase(phase)
    const params = { fields, search, ordering, page, pageSize }
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId, currentPhase),
      params
    })

    const { results, count } = data
    const transformedData = this.adapter?.transformListRulesEngine?.(results, phase) ?? results

    return {
      count,
      body: transformedData
    }
  }

  async createRulesEngine(payload) {
    const { edgeApplicationId, phase } = payload
    const currentPhase = this.getCurrentPhase(phase)
    const bodyRequest = this.adapter?.transformCreateRulesEngine?.(payload)

    const { data: response } = await this.http.request({
      method: 'POST',
      url: this.getUrl(edgeApplicationId, currentPhase),
      body: bodyRequest
    })

    return {
      feedback: 'Rule successfully created',
      id: response.data?.id
    }
  }

  async loadRulesEngine({ edgeApplicationId, id, phase = 'request' }) {
    const currentPhase = this.getCurrentPhase(phase)

    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId, currentPhase, `/${id}`)
    })

    return this.adapter?.transformLoadRulesEngine?.(data, phase) ?? data
  }

  async editRulesEngine({ edgeApplicationId, payload, reorder = false }) {
    const currentPhase = this.getCurrentPhase(payload.phase)
    const bodyRequest = this.adapter?.transformEditRulesEngine?.(payload, reorder)

    await this.http.request({
      method: 'PATCH',
      url: this.getUrl(edgeApplicationId, currentPhase, `/${payload.id}`),
      body: bodyRequest
    })

    return 'Rule successfully updated'
  }

  async deleteRulesEngine({ edgeApplicationId, ruleId, phase = 'request' }) {
    const currentPhase = this.getCurrentPhase(phase)
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, currentPhase, `/${ruleId}`)
    })

    return 'Rule successfully deleted'
  }

  async reorderRulesEngine(newOrderData, edgeApplicationId) {
    const adapt = this.adapter?.transformReorderRulesEngine?.(newOrderData)

    if (adapt.request.length > 0) {
      await this.http.request({
        method: 'PUT',
        url: this.getUrl(edgeApplicationId, 'request_rules', '/order'),
        body: { order: adapt.request }
      })
    }

    if (adapt.response.length > 0) {
      await this.http.request({
        method: 'PUT',
        url: this.getUrl(edgeApplicationId, 'response_rules', '/order'),
        body: { order: adapt.response }
      })
    }

    return 'Rules Engine successfully ordered'
  }

  async listRulesEngineRequestAndResponsePhase({ edgeApplicationId, ...params }) {
    const { count, body } = await this.listRulesEngine({
      edgeApplicationId,
      phase: 'request',
      ...params
    })
    const { count: countResponse, body: bodyResponse } = await this.listRulesEngine({
      edgeApplicationId,
      phase: 'response',
      ...params
    })

    const data = {
      count: count + countResponse,
      body: [...body, ...bodyResponse]
    }

    return data
  }

  getCurrentPhase(phase) {
    return phase === 'request' ? 'request_rules' : 'response_rules'
  }
}
