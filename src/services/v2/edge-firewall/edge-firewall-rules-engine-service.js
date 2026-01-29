import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeFirewallRulesEngineAdapter } from './edge-firewall-rules-engine-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class EdgeFirewallRulesEngineService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeFirewallRulesEngineAdapter
    this.baseURL = 'v4/workspace/firewalls'
  }

  #getUrl = (edgeFirewallId, suffix = '') => {
    return `${this.baseURL}/${edgeFirewallId}/request_rules${suffix}`
  }

  #getTransformed = (method, data) => {
    return this.adapter?.[method]?.(data) ?? data
  }

  #fetchEdgeFirewallRulesEngineList = async ({ id, fields = '', search = '' }) => {
    const allData = []
    let page = 1
    let totalCount = 0

    do {
      const { data } = await this.http.request({
        method: 'GET',
        url: this.#getUrl(id),
        params: {
          fields,
          ordering: '',
          page,
          pageSize: 100,
          search
        }
      })

      allData.push(...data.results)
      totalCount = data.count
      page++
    } while (allData.length < totalCount)

    const body = this.#getTransformed('transformListEdgeFirewallRulesEngine', allData)

    return { body, count: totalCount }
  }

  listEdgeFirewallRulesEngineService = async (params = { id: '', fields: '', search: '' }) => {
    const queryKey = queryKeys.firewall.rulesEngine.list(params.id, params)
    const skipCache = params?.hasFilter || params?.skipCache || params?.search

    return await this.useEnsureQueryData(
      queryKey,
      () => this.#fetchEdgeFirewallRulesEngineList(params),
      { persist: false, skipCache }
    )
  }

  /**
   * Prefetches the rules engine list to warm up the cache.
   * Uses prefetch to avoid duplicate requests when the same query is called multiple times.
   * @param {string} edgeFirewallId - The edge firewall ID
   */
  prefetchRulesEngineList = async (edgeFirewallId) => {
    return await this.listEdgeFirewallRulesEngineService({
      id: edgeFirewallId,
      fields: ['id', 'name', 'description', 'last_modified', 'last_editor', 'active'],
      search: ''
    })
  }

  createEdgeFirewallRulesEngineService = async (edgeFirewallId, payload) => {
    const body = this.#getTransformed('transformPayloadRulesEngine', payload)

    await this.http.request({
      method: 'POST',
      url: this.#getUrl(edgeFirewallId),
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })

    return { feedback: 'Rule Engine successfully created' }
  }

  editEdgeFirewallRulesEngineService = async (edgeFirewallId, payload) => {
    const body = this.#getTransformed('transformPayloadRulesEngine', payload)

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(edgeFirewallId, `/${payload.id}`),
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })

    return 'Rule Engine successfully updated'
  }

  #fetchEdgeFirewallRulesEngine = async ({ id, edgeFirewallId }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeFirewallId, `/${id}`)
    })

    return this.#getTransformed('transformLoadEdgeFirewallRulesEngine', data.data)
  }

  loadEdgeFirewallRulesEngineService = async ({ id, edgeFirewallId }) => {
    return await this.useEnsureQueryData(
      queryKeys.firewall.rulesEngine.detail(edgeFirewallId, id),
      () => this.#fetchEdgeFirewallRulesEngine({ id, edgeFirewallId }),
      { persist: false }
    )
  }

  reorderEdgeFirewallRulesEngineService = async (payload, edgeFirewallId) => {
    const body = this.#getTransformed('transformReorderEdgeFirewallRulesEngine', payload)

    await this.http.request({
      method: 'PUT',
      url: this.#getUrl(edgeFirewallId, '/order'),
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })

    return 'Rules Engine successfully ordered'
  }

  deleteEdgeFirewallRulesEngineService = async (edgeFirewallId, ruleEngineId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeFirewallId, `/${ruleEngineId}`)
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })

    return 'Rules Engine successfully deleted'
  }
}

export const edgeFirewallRulesEngineService = new EdgeFirewallRulesEngineService()
