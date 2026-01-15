import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeFirewallRulesEngineAdapter } from './edge-firewall-rules-engine-adapter'
import { queryKeys } from '@/services/v2/base/query/querySystem'

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
    // Serialize fields if it's an array for consistent cache keys
    const fieldsKey = Array.isArray(params.fields)
      ? params.fields.sort().join(',')
      : params.fields

    const queryKey = [
      ...queryKeys.edgeFirewallRulesEngine.lists(params.id),
      fieldsKey,
      params.search
    ].filter((item) => item !== undefined && item !== '' && item !== null)

    const hasFilter = !!params.search
    return await this._ensureQueryData(
      queryKey,
      () => this.#fetchEdgeFirewallRulesEngineList(params),
      { persist: !hasFilter, skipCache: hasFilter }
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

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFirewallRulesEngine.all(edgeFirewallId) })

    return { feedback: 'Rule Engine successfully created' }
  }

  editEdgeFirewallRulesEngineService = async (edgeFirewallId, payload) => {
    const body = this.#getTransformed('transformPayloadRulesEngine', payload)

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(edgeFirewallId, `/${payload.id}`),
      body
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.edgeFirewallRulesEngine.all(edgeFirewallId)
    })
    this.queryClient.removeQueries({
      queryKey: queryKeys.edgeFirewallRulesEngine.details(edgeFirewallId)
    })

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
    const cachedQueries = this.queryClient.getQueriesData({
      queryKey: queryKeys.edgeFirewallRulesEngine.details(edgeFirewallId)
    })

    const hasDifferentId = cachedQueries.some(([key]) => {
      const cachedId = key[key.length - 1]
      return cachedId && cachedId !== id
    })

    if (hasDifferentId) {
      await this.queryClient.removeQueries({
        queryKey: queryKeys.edgeFirewallRulesEngine.details(edgeFirewallId)
      })
    }

    return await this._ensureQueryData(
      queryKeys.edgeFirewallRulesEngine.detail(edgeFirewallId, id),
      () => this.#fetchEdgeFirewallRulesEngine({ id, edgeFirewallId }),
      { persist: true }
    )
  }

  reorderEdgeFirewallRulesEngineService = async (payload, edgeFirewallId) => {
    const body = this.#getTransformed('transformReorderEdgeFirewallRulesEngine', payload)

    await this.http.request({
      method: 'PUT',
      url: this.#getUrl(edgeFirewallId, '/order'),
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFirewallRulesEngine.all(edgeFirewallId) })

    return 'Rules Engine successfully ordered'
  }

  deleteEdgeFirewallRulesEngineService = async (edgeFirewallId, ruleEngineId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeFirewallId, `/${ruleEngineId}`)
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFirewallRulesEngine.all(edgeFirewallId) })

    return 'Rules Engine successfully deleted'
  }
}

export const edgeFirewallRulesEngineService = new EdgeFirewallRulesEngineService()
