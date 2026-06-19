import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EdgeFirewallFunctionAdapter } from '@/services/v2/edge-firewall/edge-firewall-function-adapter'

/**
 * Versioned Firewall Function service, scoped to (firewallId, versionId).
 *
 * Endpoints under `/v4/workspace/firewalls/{id}/versions/{vid}/functions`.
 * Mirrors the non-versioned function service so the shared Functions ListView
 * can use it as a drop-in.
 */
export class VersionedFirewallFunctionService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeFirewallFunctionAdapter
    this.baseURL = 'v4/workspace/firewalls'
  }

  getUrl(firewallId, versionId, suffix = '') {
    return `${this.baseURL}/${firewallId}/versions/${versionId}/functions${suffix}`
  }

  #fetchList = async (firewallId, versionId, params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(firewallId, versionId),
      params
    })

    const { results = [], count = 0 } = data ?? {}
    const body = this.adapter?.transformListFunction?.(results) ?? results

    return { count, body }
  }

  list = async (firewallId, versionId, params = {}) => {
    const skipCache = params?.hasFilter || params?.skipCache || params?.search

    return await this.useEnsureQueryData(
      queryKeys.firewall.version.functions.list(firewallId, versionId, params),
      () => this.#fetchList(firewallId, versionId, params),
      { persist: false, skipCache }
    )
  }

  #fetchOne = async (firewallId, versionId, id) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(firewallId, versionId, `/${id}`)
    })

    return this.adapter?.transformLoadEdgeFirewallFunction?.(data) ?? data
  }

  load = async (firewallId, versionId, id) => {
    return await this.useEnsureQueryData(
      queryKeys.firewall.version.functions.detail(firewallId, versionId, id),
      () => this.#fetchOne(firewallId, versionId, id),
      { persist: false }
    )
  }

  create = async (firewallId, versionId, payload) => {
    const body = this.adapter?.transformPayloadFunction?.([payload, 'POST']) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.getUrl(firewallId, versionId),
      body
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.firewall.version.functions.all(firewallId, versionId)
    })

    return { feedback: 'Your Function has been created', id: data?.id ?? data?.data?.id }
  }

  edit = async (firewallId, versionId, payload) => {
    const body = this.adapter?.transformPayloadFunction?.([payload, 'PATCH']) ?? payload

    await this.http.request({
      method: 'PUT',
      url: this.getUrl(firewallId, versionId, `/${payload.id}`),
      body
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.firewall.version.functions.all(firewallId, versionId)
    })

    return 'Function successfully updated'
  }

  remove = async (firewallId, versionId, id) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(firewallId, versionId, `/${id}`)
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.firewall.version.functions.all(firewallId, versionId)
    })

    return 'Function successfully deleted'
  }
}

export const versionedFirewallFunctionService = new VersionedFirewallFunctionService()
