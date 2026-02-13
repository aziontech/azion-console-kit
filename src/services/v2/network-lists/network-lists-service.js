import { BaseService } from '@/services/v2/base/query/baseService'
import { NetworkListsAdapter } from './network-lists-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
export class NetworkListsService extends BaseService {
  constructor() {
    super()
    this.adapter = NetworkListsAdapter
    this.baseURL = 'v4/workspace/network_lists'
  }

  #fetchNetworkLists = async (params = {}, isDropdown = false) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { results, count } = data

    let transformedData = isDropdown
      ? this.adapter?.transformListNetworkListToDropdown?.(results)
      : this.adapter?.transformListNetworkLists?.(results)

    transformedData = transformedData ?? results

    return {
      count,
      body: transformedData
    }
  }

  prefetchList = (pageSize = 10) => {
    const defaultParams = {
      page: 1,
      pageSize,
      fields: ['id', 'name', 'type', 'last_editor', 'last_modified'],
      ordering: '-last_modified'
    }
    return this.usePrefetchQuery(queryKeys.networkLists.list(defaultParams), () =>
      this.#fetchNetworkLists(defaultParams)
    )
  }

  listNetworkLists = async (
    params = { fields: '', search: '', ordering: '', page: 1, pageSize: 10 },
    isDropdown = false
  ) => {
    if (isDropdown) {
      return this.#fetchNetworkLists(params, true)
    }

    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.networkLists.list(params),
      () => this.#fetchNetworkLists(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  createNetworkLists = async (payload) => {
    const bodyRequest = this.adapter?.transformCreateNetworkList?.(payload)

    const { data: response } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: bodyRequest
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.networkLists.all })

    return response.data
  }

  loadNetworkList = async ({ id }, isDropdown = false) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    let transformedData = isDropdown
      ? this.adapter?.transformLoadNetworkListToDropdown?.(data)
      : this.adapter?.transformLoadNetworkList?.(data)

    transformedData = transformedData ?? data

    return transformedData
  }

  editNetworkList = async (payload) => {
    const bodyRequest = this.adapter?.transformEditNetworkList?.(payload)

    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body: bodyRequest
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.networkLists.all })

    return 'Your Network List has been updated.'
  }

  deleteNetworkList = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.networkLists.all })

    return 'Network list successfully deleted.'
  }

  getNetworkListFromCache = (id) => {
    if (!id) return undefined

    const listTypeMap = {
      'IP/CIDR': 'ip_cidr',
      ASN: 'asn',
      Countries: 'countries'
    }

    return super.getFromCache({
      queryKey: queryKeys.networkLists.all,
      id,
      listPath: 'body',
      select: (item) => ({
        id: item.id,
        name: item.name,
        networkListType: listTypeMap[item.listType] || item.listType
      })
    })
  }
}

export const networkListsService = new NetworkListsService()
