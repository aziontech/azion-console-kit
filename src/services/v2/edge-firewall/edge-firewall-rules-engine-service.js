import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeFirewallRulesEngineAdapter } from './edge-firewall-rules-engine-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { versionedFirewallRulesEngineService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-rules-engine-service'

const extractWafDependencies = (rules) => {
  const countById = new Map()
  for (const rule of Array.isArray(rules) ? rules : []) {
    const behaviors = Array.isArray(rule?.behaviors) ? rule.behaviors : []
    for (const behavior of behaviors) {
      const behaviorName = behavior?.type ?? behavior?.name
      if (behaviorName !== 'set_waf') continue
      const wafId = behavior?.attributes?.waf_id ?? behavior?.id
      if (wafId === null || wafId === undefined) continue
      countById.set(wafId, (countById.get(wafId) ?? 0) + 1)
    }
  }
  return Array.from(countById, ([wafId, ruleCount]) => ({ wafId, ruleCount }))
}

const extractNetworkListDependencies = (rules) => {
  const countById = new Map()
  for (const rule of Array.isArray(rules) ? rules : []) {
    const groups = Array.isArray(rule?.criteria) ? rule.criteria : []
    for (const group of groups) {
      const criteria = Array.isArray(group) ? group : [group]
      for (const criterion of criteria) {
        const variable = criterion?.variable ?? criterion?.subject
        if (variable !== '${network}') continue
        const networkListId = criterion?.argument
        if (networkListId === null || networkListId === undefined || networkListId === '') continue
        countById.set(networkListId, (countById.get(networkListId) ?? 0) + 1)
      }
    }
  }
  return Array.from(countById, ([networkListId, ruleCount]) => ({ networkListId, ruleCount }))
}

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

  listEdgeFirewallRulesEngineService = async ({
    id = '',
    fields = [],
    search = '',
    skipCache = false,
    hasFilter = false
  }) => {
    const queryKey = queryKeys.firewall.rulesEngine.list(id, { fields, search })

    const shouldSkipCache = hasFilter || skipCache || search

    return await this.useEnsureQueryData(
      queryKey,
      () => this.#fetchEdgeFirewallRulesEngineList({ id, fields, search }),
      { persist: false, skipCache: shouldSkipCache }
    )
  }

  /**
   * Prefetches the rules engine list to warm up the cache.
   * Uses prefetch to avoid duplicate requests when the same query is called multiple times.
   * @param {string} edgeFirewallId - The edge firewall ID
   */
  prefetchRulesEngineList = async (edgeFirewallId) => {
    return await this.listEdgeFirewallRulesEngineService({
      id: edgeFirewallId
    })
  }

  listWafDependenciesByVersion = async (edgeFirewallId, versionId) => {
    const { body } = await versionedFirewallRulesEngineService.listRequestRulesRaw({
      firewallId: edgeFirewallId,
      versionId,
      fields: ['id', 'name', 'behaviors']
    })

    return extractWafDependencies(body)
  }

  listNetworkListDependenciesByVersion = async (edgeFirewallId, versionId) => {
    const { body } = await versionedFirewallRulesEngineService.listRequestRulesRaw({
      firewallId: edgeFirewallId,
      versionId,
      fields: ['id', 'name', 'criteria']
    })

    return extractNetworkListDependencies(body)
  }

  createEdgeFirewallRulesEngineService = async (edgeFirewallId, payload) => {
    const body = this.#getTransformed('transformPayloadRulesEngine', payload)

    await this.http.request({
      method: 'POST',
      url: this.#getUrl(edgeFirewallId),
      body
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.firewall.rulesEngine.all(edgeFirewallId)
    })

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
      queryKey: queryKeys.firewall.rulesEngine.all(edgeFirewallId)
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

    this.queryClient.removeQueries({
      queryKey: queryKeys.firewall.rulesEngine.all(edgeFirewallId)
    })

    return 'Rules Engine successfully ordered'
  }

  deleteEdgeFirewallRulesEngineService = async (edgeFirewallId, ruleEngineId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeFirewallId, `/${ruleEngineId}`)
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.firewall.rulesEngine.all(edgeFirewallId)
    })

    return 'Rules Engine successfully deleted'
  }
}

export const edgeFirewallRulesEngineService = new EdgeFirewallRulesEngineService()
