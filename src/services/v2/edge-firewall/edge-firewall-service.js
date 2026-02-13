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
      fields: []
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

  prefetchList = (pageSize = 10) => {
    const params = {
      page: 1,
      pageSize,
      fields: [],
      ordering: '-last_modified'
    }

    return this.usePrefetchQuery(queryKeys.firewall.list(params), () => this.#fetchList(params))
  }

  listEdgeFirewallService = async (params) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.search || params?.hasFilter

    return await this.useEnsureQueryData(
      queryKeys.firewall.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  getFirewallFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.firewall.all,
      id,
      listPath: 'body',
      select: (item) => ({
        ...item,
        name: item.name?.text ?? item.name,
        isActive: item.active?.content === 'Active'
      })
    })
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

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })
    return data
  }

  cloneEdgeFirewallService = async (payload) => {
    const body = this.adapter?.transformCloneEdgeFirewall?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${payload.id}/clone`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })
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

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })
    return 'Your Firewall has been updated'
  }

  loadEdgeFirewallService = async ({ id }) => {
    return await this.useEnsureQueryData(
      queryKeys.firewall.detail(id),
      () => this.#fetchOne({ id }),
      { persist: false }
    )
  }

  deleteEdgeFirewallService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })
    return 'Your Firewall has been deleted'
  }
}

export const edgeFirewallService = new EdgeFirewallService()
