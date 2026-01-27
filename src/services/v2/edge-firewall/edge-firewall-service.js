import { toValue } from 'vue'
import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeFirewallAdapter } from './edge-firewall-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class EdgeFirewallService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeFirewallAdapter
    this.baseURL = 'v4/workspace/firewalls'
  }

  #fetchList = async (
    params = {
      pageSize: 10,
      fields: ['id', 'name', 'debug_rules', 'last_editor', 'last_modified', 'active']
    }
  ) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { results, count } = data

    const parsedEdgeFirewalls = await Promise.all(
      this.adapter?.transformListEdgeFirewall?.(results, params.fields) ?? results
    )

    return {
      count,
      body: parsedEdgeFirewalls
    }
  }

  ensureList = async (pageSize = 10) => {
    const params = {
      page: 1,
      pageSize,
      fields: [
        'id',
        'name',
        'debug_rules',
        'last_editor',
        'last_modified',
        'last_modify',
        'active'
      ],
      ordering: '-last_modified'
    }

    await this.useEnsureQueryData(
      queryKeys.edgeFirewall.list(params),
      () => this.#fetchList(params),
      {
        persist: !params.search
      }
    )
  }

  listEdgeFirewallService = async (params) => {
    const paramsValue = toValue(params)
    const hasFilter = paramsValue?.hasFilter || false
    return await this.useEnsureQueryData(
      queryKeys.edgeFirewall.list(paramsValue),
      () => this.#fetchList(paramsValue),
      {
        persist: paramsValue?.page === 1 && !paramsValue?.search && !hasFilter,
        skipCache: paramsValue?.skipCache || hasFilter
      }
    )
  }

  listEdgeFirewallServiceDropdown = async (
    params = {
      pageSize: 10,
      fields: ['id', 'name']
    }
  ) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { results, count } = data

    const parsedEdgeFirewalls = await Promise.all(
      this.adapter?.transformListEdgeFirewallDropdown?.(results, params.fields) ?? results
    )

    return {
      count,
      body: parsedEdgeFirewalls
    }
  }

  #fetchOne = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter?.transformLoadEdgeFirewall?.(data) ?? data.data
  }

  createEdgeFirewallService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFirewall.lists() })
    return data
  }

  cloneEdgeFirewallService = async (payload) => {
    const body = this.adapter?.transformCloneEdgeFirewall?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${payload.id}/clone`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFirewall.lists() })
    return {
      feedback: 'Your Firewall has been cloned',
      urlToEditView: `/firewalls/edit/${data.data.id}`,
      id: data.data.id
    }
  }

  editEdgeFirewallService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFirewall.lists() })
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFirewall.details() })
    return 'Your Firewall has been updated'
  }

  loadEdgeFirewallService = async ({ id }) => {
    const cachedQueries = this.queryClient.getQueriesData({
      queryKey: queryKeys.edgeFirewall.details()
    })

    const hasDifferentId = cachedQueries.some(([key]) => {
      const cachedId = key[key.length - 1]
      return cachedId && cachedId !== id
    })

    if (hasDifferentId) {
      await this.queryClient.removeQueries({ queryKey: queryKeys.edgeFirewall.details() })
    }

    return await this.useEnsureQueryData(
      queryKeys.edgeFirewall.detail(id),
      () => this.#fetchOne({ id }),
      { persist: true }
    )
  }

  deleteEdgeFirewallService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFirewall.lists() })
    return 'Your Firewall has been deleted'
  }
}

export const edgeFirewallService = new EdgeFirewallService()
