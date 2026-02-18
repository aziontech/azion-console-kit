import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeNodeAdapter } from './edge-node-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'

export class EdgeNodeService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeNodeAdapter
    this.v3URL = 'v3/edge_nodes'
    this.v4URL = 'v4/edge_orchestrator/edge_nodes'
  }

  #getV3Url(id, suffix = '') {
    if (!id) {
      return `${this.v3URL}${suffix}`
    }
    return `${this.v3URL}/${id}${suffix}`
  }

  #parseOrdering(ordering = 'id') {
    const isDesc = ordering.startsWith('-')
    return {
      order_by: isDesc ? ordering.slice(1) : ordering,
      sort: isDesc ? 'desc' : 'asc'
    }
  }

  #fetchListV3 = async (params = { page: 1, pageSize: 200, ordering: 'id' }) => {
    const { order_by, sort } = this.#parseOrdering(params.ordering)

    const { data } = await this.http.request({
      method: 'GET',
      url: this.v3URL,
      params: {
        order_by,
        sort,
        page: params.page,
        page_size: params.pageSize
      },
      config: { baseURL: '/api' }
    })

    const results = data.nodes || []
    const count = data.count || results.length
    const body = this.adapter?.transformList?.(results) ?? results

    return { body, count }
  }

  #fetchListV4 = async (params = { page: 1, pageSize: 10, ordering: 'name' }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.v4URL,
      params: {
        search: params.search || '',
        fields: params.fields || '',
        ordering: params.ordering,
        page: params.page,
        page_size: params.pageSize
      }
    })

    const results = data.results || []
    const count = data.count || results.length
    const body = this.adapter?.transformListV4?.(results) ?? results

    return { body, count }
  }

  #fetchList = async (params) => {
    if (hasFlagBlockApiV4()) {
      return this.#fetchListV3(params)
    }
    return this.#fetchListV4(params)
  }

  prefetchList = (pageSize = 200) => {
    const defaultParams = hasFlagBlockApiV4()
      ? { page: 1, pageSize, fields: [], ordering: 'id' }
      : { page: 1, pageSize, fields: [], ordering: 'name' }

    return this.usePrefetchQuery(queryKeys.edgeNode.list(defaultParams), () =>
      this.#fetchList(defaultParams)
    )
  }

  listEdgeNodeService = async (params = {}) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeNode.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  getEdgeNodeFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.edgeNode.all,
      id,
      listPath: 'body',
      select: (item) => ({
        id: item.id,
        name: item.name,
        hashId: item.hashId,
        groups: item.groups
      })
    })
  }

  loadEdgeNodeService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getV3Url(id),
      config: { baseURL: '/api' }
    })

    return this.adapter?.transformLoad?.(data, id) ?? data
  }

  editEdgeNodeService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: this.#getV3Url(payload.id),
      body,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeNode.all })

    return 'Your edge node has been updated'
  }

  deleteEdgeNodeService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getV3Url(id),
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeNode.all })

    return 'Edge Node successfully deleted'
  }

  authorizeEdgeNodeService = async (id) => {
    await this.http.request({
      method: 'PATCH',
      url: this.#getV3Url(id),
      body: { status: 'Authorized' },
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeNode.all })

    return 'Edge Node successfully authorized'
  }

  listGroupsEdgeNodeService = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getV3Url(null, '/groups'),
      config: { baseURL: '/api' }
    })

    return data
  }

  #fetchServicesList = async (edgeNodeId, params = {}) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page)
    searchParams.set('page_size', params.pageSize || 1000000)
    searchParams.set('is_bound', params.bound ?? true)

    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#getV3Url(edgeNodeId, '/services')}?${searchParams.toString()}`,
      config: { baseURL: '/api' }
    })

    const results = data.services || []
    const count = data.count || results.length
    const body = this.adapter?.transformServicesList?.(results) ?? results

    return { body, count }
  }

  listServiceEdgeNodeService = async (params = {}) => {
    const { edgeNodeId, ...queryParams } = params
    const firstPage = queryParams?.page === 1
    const skipCache = queryParams?.skipCache || queryParams?.hasFilter || queryParams?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeNode.services.list(edgeNodeId, queryParams),
      () => this.#fetchServicesList(edgeNodeId, queryParams),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  prefetchTabsData = (edgeNodeId, pageSize = 10) => {
    const servicesParams = {
      page: 1,
      pageSize,
      fields: [],
      bound: true
    }

    this.usePrefetchQuery(queryKeys.edgeNode.services.list(edgeNodeId, servicesParams), () =>
      this.#fetchServicesList(edgeNodeId, servicesParams)
    )
  }

  createServiceEdgeNodeService = async (payload) => {
    const { id } = payload
    const body = this.adapter?.transformCreateServicePayload?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getV3Url(id, '/services'),
      body,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeNode.all })

    return {
      feedback: 'Service was added to the edge node',
      resource: data
    }
  }

  editServiceEdgeNodeService = async (payload) => {
    const body = this.adapter?.transformEditServicePayload?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: `${this.#getV3Url(payload.edgeNodeId, '/services')}/${payload.id}`,
      body,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeNode.all })

    return 'Your service on edge node has been updated'
  }

  loadServiceEdgeNodeService = async ({ id, edgeNodeId }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#getV3Url(edgeNodeId, '/services')}/${id}`,
      config: { baseURL: '/api' }
    })

    return this.adapter?.transformLoadService?.(data, id) ?? data
  }

  deleteServiceEdgeNodeService = async ({ edgeNodeId, id }) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#getV3Url(edgeNodeId, '/services')}/${id}`,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeNode.all })

    return 'Service successfully unbound'
  }
}

export const edgeNodeService = new EdgeNodeService()
