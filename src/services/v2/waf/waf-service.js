import { BaseService } from '@/services/v2/base/query/baseService'
import { WafAdapter } from './waf-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { transformSnakeToCamel } from '@/services/v2/utils/adaptServiceDataResponse'
import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
import { useTableDefinitionsStore } from '@/stores/table-definitions'

const ALL_THREATS = [
  'cross_site_scripting',
  'directory_traversal',
  'evading_tricks',
  'file_upload',
  'identified_attack',
  'remote_file_inclusion',
  'sql_injection',
  'unwanted_access'
]
export class WafService extends BaseService {
  constructor() {
    super()
    this.adapter = WafAdapter
    this.baseURL = 'v4/workspace/wafs'
  }

  #fetchWafRulesList = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { results, count } = data
    const fieldsSplits = Array.isArray(params.fields)
      ? params.fields
      : (params.fields || '')
          .split(',')
          .map((field) => field.trim())
          .filter(Boolean)

    const body = this.adapter?.transformListWafRules?.(results, fieldsSplits) ?? results

    return {
      body,
      count
    }
  }

  prefetchList = (pageSize = 10) => {
    const defaultParams = {
      page: 1,
      pageSize,
      fields: [],
      ordering: '-last_modified'
    }
    return this.usePrefetchQuery(queryKeys.waf.list(defaultParams), () =>
      this.#fetchWafRulesList(defaultParams)
    )
  }

  listWafRules = async (
    params = { search: '', fields: '', ordering: 'name', page: 1, pageSize: 10 }
  ) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.waf.list(params),
      () => this.#fetchWafRulesList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  getWafRuleFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.waf.all,
      id,
      listPath: 'body',
      select: (item) => {
        const thresholds = item.engineSettings?.attributes?.thresholds || []
        const inputMap = Object.fromEntries(
          thresholds.map(({ threat, sensitivity }) => [threat, sensitivity])
        )

        const threatsConfiguration = ALL_THREATS.reduce((acc, threat) => {
          const camel = transformSnakeToCamel(threat)
          acc[camel] = threat in inputMap
          acc[`${camel}Sensitivity`] = inputMap[threat] || 'medium'
          return acc
        }, {})

        return {
          id: item.id,
          name: item.name,
          active: item.active?.content === 'Active',
          ...threatsConfiguration
        }
      }
    })
  }

  createWafRule = async (payload) => {
    const adaptedPayload = this.adapter.adaptWafRulePayload(payload)
    const { data: response } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: adaptedPayload
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.waf.all })

    return response.data
  }

  editWafRule = async (payload, wafId) => {
    const adaptedPayload = this.adapter.adaptWafRulePayload(payload)
    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${wafId}`,
      body: adaptedPayload
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.waf.all })

    return 'Your WAF rule has been updated.'
  }

  deleteWafRule = async (wafId) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${wafId}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.waf.all })

    return 'WAF Rule successfully deleted.'
  }

  loadWafRule = async ({ id }) => {
    const { data: response } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter?.transformLoadWafRule?.(response) ?? response
  }

  cloneWafRule = async (payload) => {
    const body = this.adapter?.transformCloneWafRule?.(payload) ?? payload

    const { data: response } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${payload.id}/clone`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.waf.all })

    return {
      feedback: 'Your WAF rule has been cloned',
      urlToEditView: `/waf/edit/${response.data.id}`
    }
  }

  createWafRuleAllowed = async ({ payload, id }) => {
    const adaptedPayload = this.adapter.adaptCreateWafRuleAllowedPayload(payload)
    await this.http.request({
      url: `${this.baseURL}/${id}/exceptions`,
      method: 'POST',
      body: adaptedPayload
    })

    return {
      feedback: 'Your waf rule allowed has been created'
    }
  }

  async _createTuningRequest({ wafId, payload }) {
    await this.http.request({
      url: `${this.baseURL}/${wafId}/exceptions`,
      method: 'POST',
      body: payload
    })

    return { feedback: 'Your waf rule allowed has been created' }
  }

  createWafRulesAllowedTuning = async ({ attackEvents, wafId, name }) => {
    const requests = attackEvents.flatMap((attack) => {
      if (!attack?.top10Paths) {
        const payload = this.adapter.adaptCreateWafRuleAllowedTuningPayload(attack, name)
        return [this._createTuningRequest({ wafId, payload })]
      }

      return attack.top10Paths.map(({ path }) => {
        const payload = this.adapter.adaptCreateWafRuleAllowedTuningPayload(attack, name, path)
        return this._createTuningRequest({ wafId, payload })
      })
    })

    return Promise.allSettled(requests)
  }

  deleteWafRuleAllowed = async ({ wafId, allowedId }) => {
    await this.http.request({
      url: `${this.baseURL}/${wafId}/exceptions/${allowedId}`,
      method: 'DELETE'
    })

    return 'WAF allowed rule successfully deleted'
  }

  editWafRuleAllowed = async ({ payload, wafId, allowedId }) => {
    const adaptedPayload = this.adapter.adaptCreateWafRuleAllowedPayload(payload)
    await this.http.request({
      url: `${this.baseURL}/${wafId}/exceptions/${allowedId}`,
      method: 'PUT',
      body: adaptedPayload
    })

    return 'Your waf rule allowed has been updated'
  }

  loadWafRuleAllowed = async ({ id, allowedId }) => {
    const { data } = await this.http.request({
      url: `${this.baseURL}/${id}/exceptions/${allowedId.id}`,
      method: 'GET'
    })

    return this.adapter?.transformLoadWafRuleAllowed?.(data)
  }

  #fetchWafRulesAllowed = async (params) => {
    const { data } = await this.http.request({
      url: `${this.baseURL}/${params.wafId}/exceptions`,
      method: 'GET',
      params
    })

    return this.adapter?.transformListWafRulesAllowed?.(data)
  }

  listWafRulesAllowed = async (params) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.waf.allowed(params.wafId, params),
      () => this.#fetchWafRulesAllowed(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  #fetchWafDomains = async (wafId) => {
    const { data } = await this.http.request({
      url: `/api/v3/waf/${wafId}/domains`,
      method: 'GET',
      params: { page_size: 200 }
    })

    const results = Array.isArray(data.results) ? data.results : []
    return results.map((domain) => ({
      domain: domain.domain,
      id: domain.id,
      name: domain.name
    }))
  }

  listWafDomains = async (wafId) => {
    return await this.useEnsureQueryData(
      queryKeys.waf.domains(wafId),
      () => this.#fetchWafDomains(wafId),
      { persist: true }
    )
  }

  prefetchTabsData = (wafId) => {
    const tableDefinitions = useTableDefinitionsStore()
    const pageSize = tableDefinitions.getNumberOfLinesPerPage || 10

    const allowedParams = {
      wafId,
      page: 1,
      pageSize,
      fields: [],
      ordering: 'id'
    }

    this.usePrefetchQuery(queryKeys.waf.allowed(wafId, allowedParams), () =>
      this.#fetchWafRulesAllowed(allowedParams)
    )

    this.usePrefetchQuery(queryKeys.waf.domains(wafId), () => this.#fetchWafDomains(wafId))

    networkListsService.prefetchNetworkListsDropdown()
  }
}

export const wafService = new WafService()
