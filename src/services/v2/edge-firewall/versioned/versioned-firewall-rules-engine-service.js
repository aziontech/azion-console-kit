import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EdgeFirewallRulesEngineAdapter } from '@/services/v2/edge-firewall/edge-firewall-rules-engine-adapter'

/**
 * Versioned Firewall Rules Engine service, scoped to (firewallId, versionId).
 *
 * Endpoints under `/v4/workspace/firewalls/{id}/versions/{vid}/request_rules`
 * (+ `/order` for reorder). Mirrors the non-versioned service method-for-method
 * so the shared Rules Engine ListView can use it as a drop-in.
 */
export class VersionedFirewallRulesEngineService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeFirewallRulesEngineAdapter
    this.baseURL = 'v4/workspace/firewalls'
    this.versionId = null
  }

  bindVersion(versionId) {
    this.versionId = versionId
    return this
  }

  #getUrl = (firewallId, versionId, suffix = '') => {
    return `${this.baseURL}/${firewallId}/versions/${versionId}/request_rules${suffix}`
  }

  #getTransformed = (method, data) => {
    return this.adapter?.[method]?.(data) ?? data
  }

  #fetchList = async ({ firewallId, versionId, fields = '', search = '' }) => {
    const allData = []
    let page = 1
    let totalCount = 0

    do {
      const { data } = await this.http.request({
        method: 'GET',
        url: this.#getUrl(firewallId, versionId),
        params: { fields, ordering: '', page, pageSize: 100, search }
      })

      allData.push(...(data?.results ?? []))
      totalCount = data?.count ?? allData.length
      page++
    } while (allData.length < totalCount)

    const body = this.#getTransformed('transformListEdgeFirewallRulesEngine', allData)

    return { body, count: totalCount }
  }

  listEdgeFirewallRulesEngineService = async ({
    id = '',
    versionId = this.versionId,
    fields = [],
    search = '',
    skipCache = false,
    hasFilter = false
  }) => {
    const shouldSkipCache = hasFilter || skipCache || search

    return await this.useEnsureQueryData(
      queryKeys.firewall.version.rulesEngine.list(id, versionId, { fields, search }),
      () => this.#fetchList({ firewallId: id, versionId, fields, search }),
      { persist: false, skipCache: shouldSkipCache }
    )
  }

  createEdgeFirewallRulesEngineService = async (
    firewallId,
    payload,
    versionId = this.versionId
  ) => {
    const body = this.#getTransformed('transformPayloadRulesEngine', payload)

    await this.http.request({
      method: 'POST',
      url: this.#getUrl(firewallId, versionId),
      body
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.firewall.version.rulesEngine.all(firewallId, versionId)
    })

    return { feedback: 'Rule Engine successfully created' }
  }

  editEdgeFirewallRulesEngineService = async (firewallId, payload, versionId = this.versionId) => {
    const body = this.#getTransformed('transformPayloadRulesEngine', payload)

    await this.http.request({
      method: 'PUT',
      url: this.#getUrl(firewallId, versionId, `/${payload.id}`),
      body
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.firewall.version.rulesEngine.all(firewallId, versionId)
    })

    return 'Rule Engine successfully updated'
  }

  #fetchOne = async ({ id, firewallId, versionId }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(firewallId, versionId, `/${id}`)
    })

    return this.#getTransformed('transformLoadEdgeFirewallRulesEngine', data?.data ?? data)
  }

  loadEdgeFirewallRulesEngineService = async ({
    id,
    edgeFirewallId,
    versionId = this.versionId
  }) => {
    return await this.useEnsureQueryData(
      queryKeys.firewall.version.rulesEngine.detail(edgeFirewallId, versionId, id),
      () => this.#fetchOne({ id, firewallId: edgeFirewallId, versionId }),
      { persist: false }
    )
  }

  reorderEdgeFirewallRulesEngineService = async (
    payload,
    firewallId,
    versionId = this.versionId
  ) => {
    const body = this.#getTransformed('transformReorderEdgeFirewallRulesEngine', payload)

    await this.http.request({
      method: 'PUT',
      url: this.#getUrl(firewallId, versionId, '/order'),
      body
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.firewall.version.rulesEngine.all(firewallId, versionId)
    })

    return 'Rules Engine successfully ordered'
  }

  deleteEdgeFirewallRulesEngineService = async (
    firewallId,
    ruleEngineId,
    versionId = this.versionId
  ) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(firewallId, versionId, `/${ruleEngineId}`)
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.firewall.version.rulesEngine.all(firewallId, versionId)
    })

    return 'Rules Engine successfully deleted'
  }
}

export const versionedFirewallRulesEngineService = new VersionedFirewallRulesEngineService()
