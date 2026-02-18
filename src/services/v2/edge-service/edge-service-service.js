import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeServiceAdapter, transformEdgeServiceItem } from './edge-service-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class EdgeServiceService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeServiceAdapter
    this.baseURL = 'v3/edge_services'
  }

  #getUrl(id, suffix = '') {
    if (!id) {
      return `${this.baseURL}${suffix}`
    }
    return `${this.baseURL}/${id}${suffix}`
  }

  #parseOrdering(ordering = '-last_modified') {
    const isDesc = ordering.startsWith('-')
    return {
      order_by: isDesc ? ordering.slice(1) : ordering,
      sort: isDesc ? 'desc' : 'asc'
    }
  }

  #fetchList = async (params = { page: 1, pageSize: 200, ordering: '-last_modified' }) => {
    const { order_by, sort } = this.#parseOrdering(params.ordering)

    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(),
      params: {
        order_by,
        sort,
        page: params.page,
        page_size: params.pageSize
      },
      config: { baseURL: '/api' }
    })

    const results = data.services || []
    const count = data.count || results.length

    const body = this.adapter?.transformList?.(results) ?? results

    return {
      body,
      count
    }
  }

  prefetchList = (pageSize = 200) => {
    const defaultParams = {
      page: 1,
      pageSize,
      fields: [],
      ordering: '-last_modified'
    }
    return this.usePrefetchQuery(queryKeys.edgeService.list(defaultParams), () =>
      this.#fetchList(defaultParams)
    )
  }

  listEdgeServiceService = async (
    params = {
      page: 1,
      pageSize: 200,
      ordering: '-last_modified'
    }
  ) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeService.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  getEdgeServiceFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.edgeService.all,
      id,
      listPath: 'body',
      select: (item) => {
        if (!item.rawData) {
          return {
            id: item.id,
            name: item.name,
            active: item.active
          }
        }

        return transformEdgeServiceItem(item.rawData)
      }
    })
  }

  loadEdgeServiceService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(id),
      params: {
        with_vars: true
      },
      config: { baseURL: '/api' }
    })

    return this.adapter?.transformLoad?.(data) ?? data
  }

  createEdgeServiceService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeService.all })

    return data
  }

  editEdgeServiceService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(payload.id),
      body,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeService.all })

    return 'Your edge service has been updated'
  }

  deleteEdgeServiceService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(id),
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeService.all })

    return 'Service successfully deleted'
  }

  #fetchResourcesList = async (edgeServiceId, params = {}) => {
    const { order_by, sort } = this.#parseOrdering(params.ordering || 'name')

    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeServiceId, '/resources'),
      params: {
        order_by,
        sort,
        page: params.page || 1,
        page_size: params.pageSize || 200
      },
      config: { baseURL: '/api' }
    })

    const results = data.resources || []
    const count = data.count || results.length

    const body = this.adapter?.transformResourcesList?.(results) ?? results

    return {
      body,
      count
    }
  }

  listResourcesService = async (params = {}) => {
    const { id, ...queryParams } = params
    const firstPage = queryParams?.page === 1
    const skipCache = queryParams?.skipCache || queryParams?.hasFilter || queryParams?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeService.resources.list(id, queryParams),
      () => this.#fetchResourcesList(id, queryParams),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  prefetchTabsData = (edgeServiceId, pageSize = 10) => {
    const resourcesParams = {
      page: 1,
      pageSize,
      fields: [],
      ordering: 'id'
    }

    this.usePrefetchQuery(
      queryKeys.edgeService.resources.list(edgeServiceId, resourcesParams),
      () => this.#fetchResourcesList(edgeServiceId, resourcesParams)
    )
  }
}

export const edgeServiceService = new EdgeServiceService()
