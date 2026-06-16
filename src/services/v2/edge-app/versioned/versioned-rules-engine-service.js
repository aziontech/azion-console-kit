import { BaseService } from '@/services/v2/base/query/baseService'
import { RulesEngineAdapter } from '@/services/v2/edge-app/edge-app-rules-engine-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

/**
 * Versioned Rules Engine service — the combined (request + response) counterpart
 * of `RulesEngineService`, scoped to an application version. It mirrors the
 * non-versioned service method-for-method so the shared ListView/Drawer can use
 * it as a drop-in; the only difference is the `/versions/{versionId}/` URL prefix.
 */
export class VersionedRulesEngineService extends BaseService {
  constructor() {
    super()
    this.adapter = RulesEngineAdapter
    this.baseURL = 'v4/workspace/applications'
  }

  getUrl(edgeApplicationId, versionId, phase, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/versions/${versionId}/${phase}${suffix}`
  }

  getCurrentPhase(phase) {
    return phase === 'request' ? 'request_rules' : 'response_rules'
  }

  async createRulesEngine(payload) {
    const { edgeApplicationId, versionId, phase } = payload
    const currentPhase = this.getCurrentPhase(phase)
    const bodyRequest = this.adapter?.transformCreateRulesEngine?.(payload)

    const { data: response } = await this.http.request({
      method: 'POST',
      url: this.getUrl(edgeApplicationId, versionId, currentPhase),
      body: bodyRequest
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.rulesEngine.all(edgeApplicationId, versionId)
    })

    return {
      feedback: 'Rule successfully created',
      id: response.data?.id
    }
  }

  async loadRulesEngine({ edgeApplicationId, versionId, id, phase = 'request' }) {
    const currentPhase = this.getCurrentPhase(phase)

    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId, versionId, currentPhase, `/${id}`)
    })

    return this.adapter?.transformLoadRulesEngine?.(data, phase) ?? data
  }

  async editRulesEngine({ edgeApplicationId, versionId, payload, reorder = false }) {
    const currentPhase = this.getCurrentPhase(payload.phase)
    const bodyRequest = this.adapter?.transformEditRulesEngine?.(payload, reorder)

    await this.http.request({
      method: 'PATCH',
      url: this.getUrl(edgeApplicationId, versionId, currentPhase, `/${payload.id}`),
      body: bodyRequest
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.rulesEngine.all(edgeApplicationId, versionId)
    })

    return 'Rule successfully updated'
  }

  async deleteRulesEngine({ edgeApplicationId, versionId, ruleId, phase = 'request' }) {
    const currentPhase = this.getCurrentPhase(phase)
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, versionId, currentPhase, `/${ruleId}`)
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.rulesEngine.all(edgeApplicationId, versionId)
    })

    return 'Rule successfully deleted'
  }

  async reorderRulesEngine(newOrderData, edgeApplicationId, versionId) {
    const adapt = this.adapter?.transformReorderRulesEngine?.(newOrderData)

    if (adapt.request.length > 0) {
      await this.http.request({
        method: 'PUT',
        url: this.getUrl(edgeApplicationId, versionId, 'request_rules', '/order'),
        body: { order: adapt.request }
      })
    }

    if (adapt.response.length > 0) {
      await this.http.request({
        method: 'PUT',
        url: this.getUrl(edgeApplicationId, versionId, 'response_rules', '/order'),
        body: { order: adapt.response }
      })
    }

    this.queryClient.removeQueries({
      queryKey: queryKeys.application.version.rulesEngine.all(edgeApplicationId, versionId)
    })

    return 'Rules Engine successfully ordered'
  }

  async _listRulesEngine({
    edgeApplicationId,
    versionId,
    phase = 'request',
    fields = '',
    search = '',
    ordering = '',
    page = 1
  }) {
    const PAGE_SIZE = 100
    const currentPhase = this.getCurrentPhase(phase)
    const params = { fields, search, ordering, page, pageSize: PAGE_SIZE }
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId, versionId, currentPhase),
      params
    })

    const { results, count } = data

    return {
      count,
      body: results
    }
  }

  async _fetchAllRulesForPhase(edgeApplicationId, versionId, phase, params) {
    const PAGE_SIZE = 100
    let allRules = []

    const { count, body } = await this._listRulesEngine({
      edgeApplicationId,
      versionId,
      phase,
      page: 1,
      ...params
    })
    allRules.push(...body)

    if (count > PAGE_SIZE) {
      const totalPages = Math.ceil(count / PAGE_SIZE)
      const promisesPerPage = []

      for (let page = 2; page <= totalPages; page++) {
        promisesPerPage.push(
          this._listRulesEngine({ ...params, edgeApplicationId, versionId, phase, page })
        )
      }

      const subsequentPages = await Promise.all(promisesPerPage)

      subsequentPages.forEach((pageResponse) => {
        allRules.push(...pageResponse.body)
      })
    }

    const transformedData = this.adapter?.transformListRulesEngine?.(allRules, phase) ?? allRules

    transformedData.sort((dataA, dataB) => dataA.position.value - dataB.position.value)

    return transformedData
  }

  async listRulesEngineRequestAndResponsePhase({ edgeApplicationId, versionId, params }) {
    const skipCache = params?.hasFilter || params?.skipCache || params?.search
    delete params.pageSize
    return await this.useEnsureQueryData(
      queryKeys.application.version.rulesEngine.list(edgeApplicationId, versionId, params),
      async () => {
        const [requestRules, responseRules] = await Promise.all([
          this._fetchAllRulesForPhase(edgeApplicationId, versionId, 'request', params),
          this._fetchAllRulesForPhase(edgeApplicationId, versionId, 'response', params)
        ])

        const responseBody = [...requestRules, ...responseRules]

        return {
          count: responseBody.length,
          body: responseBody
        }
      },
      {
        persist: false,
        skipCache
      }
    )
  }
}

export const versionedRulesEngineService = new VersionedRulesEngineService()
