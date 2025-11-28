import { BaseService } from '@/services/v2/base/query/baseService'
import { RulesEngineAdapter } from './edge-app-rules-engine-adapter'

export const rulesEngineKeys = {
  all: (edgeAppId) => ['rules-engine', edgeAppId]
}

export class RulesEngineService extends BaseService {
  constructor() {
    super()
    this.adapter = RulesEngineAdapter
    this.baseURL = 'v4/workspace/applications'
  }

  getUrl(edgeApplicationId, phase, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/${phase}${suffix}`
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

    // Remove list queries from cache (including IndexedDB) after creating
    this.queryClient.removeQueries({ queryKey: rulesEngineKeys.all(edgeApplicationId) })

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

    // Remove list queries from cache (including IndexedDB) after editing
    this.queryClient.removeQueries({ queryKey: rulesEngineKeys.all(edgeApplicationId) })

    return 'Rule successfully updated'
  }

  async deleteRulesEngine({ edgeApplicationId, ruleId, phase = 'request' }) {
    const currentPhase = this.getCurrentPhase(phase)
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, currentPhase, `/${ruleId}`)
    })

    // Remove list queries from cache (including IndexedDB) after deleting
    this.queryClient.removeQueries({ queryKey: rulesEngineKeys.all(edgeApplicationId) })

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

    // Remove list queries from cache (including IndexedDB) after reordering
    this.queryClient.removeQueries({ queryKey: rulesEngineKeys.all(edgeApplicationId) })

    return 'Rules Engine successfully ordered'
  }

  async _listRulesEngine({
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

    return {
      count,
      body: results
    }
  }

  async _fetchAllRulesForPhase(edgeApplicationId, phase, params) {
    const PAGE_SIZE = 100
    let allRules = []

    const { count, body } = await this._listRulesEngine({
      edgeApplicationId,
      phase,
      page: 1,
      ...params
    })
    allRules.push(...body)

    if (count > PAGE_SIZE) {
      const totalPages = Math.ceil(count / PAGE_SIZE)
      const promisesPerPage = []

      for (let page = 2; page <= totalPages; page++) {
        promisesPerPage.push(this._listRulesEngine({ ...params, edgeApplicationId, phase, page }))
      }

      const subsequentPages = await Promise.all(promisesPerPage)

      subsequentPages.forEach((pageResponse) => {
        allRules.push(...pageResponse.body)
      })
    }

    const transformedData = this.adapter?.transformListRulesEngine?.(allRules, phase) ?? allRules

    return transformedData
  }

  async listRulesEngineRequestAndResponsePhase({ edgeApplicationId, params }) {
    return await this._ensureQueryData(
      () => rulesEngineKeys.all(edgeApplicationId),
      async () => {
        const [requestRules, responseRules] = await Promise.all([
          this._fetchAllRulesForPhase(edgeApplicationId, 'request', params),
          this._fetchAllRulesForPhase(edgeApplicationId, 'response', params)
        ])

        const responseBody = [...requestRules, ...responseRules]

        return {
          count: responseBody.length,
          body: responseBody
        }
      },
      { persist: true }
    )
  }

  getCurrentPhase(phase) {
    return phase === 'request' ? 'request_rules' : 'response_rules'
  }
}

export const rulesEngineService = new RulesEngineService()
