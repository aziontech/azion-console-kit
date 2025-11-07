import { BaseService } from '@/services/v2/base/query/baseService'
import { RulesEngineAdapter } from './edge-app-rules-engine-adapter'

const CONSTANTS = {
  CACHE_KEY: 'rules-engine-list',
  DEFAULT_PAGE_SIZE: 100,
  MESSAGES: {
    CREATE_SUCCESS: 'Rule successfully created',
    UPDATE_SUCCESS: 'Rule successfully updated',
    DELETE_SUCCESS: 'Rule successfully deleted',
    REORDER_SUCCESS: 'Rules Engine successfully ordered'
  }
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

  async createRulesEngine(payload) {
    const { edgeApplicationId, phase } = payload
    const currentPhase = this.getCurrentPhase(phase)
    const bodyRequest = this.adapter?.transformCreateRulesEngine?.(payload)

    const { data: response } = await this.http.request({
      method: 'POST',
      url: this.getUrl(edgeApplicationId, currentPhase),
      body: bodyRequest
    })

    await this.invalidateListCache(edgeApplicationId)

    return {
      feedback: CONSTANTS.MESSAGES.CREATE_SUCCESS,
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

    await this.invalidateListCache(edgeApplicationId)

    return CONSTANTS.MESSAGES.UPDATE_SUCCESS
  }

  async deleteRulesEngine({ edgeApplicationId, ruleId, phase = 'request' }) {
    const currentPhase = this.getCurrentPhase(phase)
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, currentPhase, `/${ruleId}`)
    })

    await this.invalidateListCache(edgeApplicationId)

    return CONSTANTS.MESSAGES.DELETE_SUCCESS
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

    await this.invalidateListCache(edgeApplicationId)

    return CONSTANTS.MESSAGES.REORDER_SUCCESS
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
    return this.queryAsync({
      key: [CONSTANTS.CACHE_KEY, `edgeAppId=${edgeApplicationId}`, params],
      cache: this.cacheType.GLOBAL,
      queryFn: async () => {
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
      staleTime: this.cacheTime.TEN_MINUTES,
      gcTime: this.cacheTime.THIRTY_MINUTES
    })
  }

  getCurrentPhase(phase) {
    return phase === 'request' ? 'request_rules' : 'response_rules'
  }
}

export const rulesEngineService = new RulesEngineService()
