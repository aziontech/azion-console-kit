import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeConnectorsAdapter } from './edge-connectors-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
export class EdgeConnectorsService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeConnectorsAdapter
    this.baseURL = 'v4/workspace/connectors'
  }

  #fetchConnectorsList = async (params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { count, results } = data

    const body = this.adapter?.transformListEdgeConnectors?.(results) ?? results

    return {
      body,
      count
    }
  }

  prefetchList = (pageSize = 10) => {
    const defaultParams = {
      page: 1,
      pageSize,
      ordering: '-last_modified'
    }
    return this.usePrefetchQuery(queryKeys.edgeConnectors.list(defaultParams), () =>
      this.#fetchConnectorsList(defaultParams)
    )
  }

  listEdgeConnectorsService = async (params = { pageSize: 10 }) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeConnectors.list(params),
      () => this.#fetchConnectorsList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  listEdgeConnectorsDropDownService = async (params, callBackFilter) => {
    const { body, count } = await this.listEdgeConnectorsService(params)
    const filterTypes = body.filter(callBackFilter)
    return {
      body: filterTypes,
      count
    }
  }

  createEdgeConnectorsService = async (payload) => {
    const body = this.adapter?.transformPayloadEdgeConnectors?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeConnectors.all })

    const { id } = data.data

    return {
      ...data,
      id: parseInt(id)
    }
  }

  editEdgeConnectorsService = async (payload) => {
    const body = this.adapter?.transformPayloadEdgeConnectors?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeConnectors.all })

    return 'Connector has been updated'
  }

  loadEdgeConnectorsService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter?.transformLoadEdgeConnectors?.(data) ?? data.data
  }

  getEdgeConnectorFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.edgeConnectors.all,
      id,
      listPath: 'body',
      select: (item) => ({
        id: item.id,
        name: item.name,
        active: item.active?.content === 'Active'
      })
    })
  }

  deleteEdgeConnectorsService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeConnectors.all })

    return 'Resource successfully deleted'
  }
}

export const edgeConnectorsService = new EdgeConnectorsService()
