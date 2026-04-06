import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeFunctionsAdapter, transformEdgeFunctionItem } from './edge-function-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class EdgeFunctionService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeFunctionsAdapter
    this.baseURL = 'v4/workspace/functions'
  }

  #getUrl(id, suffix = '') {
    if (!id) {
      return `${this.baseURL}${suffix}`
    }
    return `${this.baseURL}/${id}${suffix}`
  }

  loadEdgeFunctionByEdgeApplicationFunction = async (
    edgeApplicationFunction,
    params = { pageSize: 10, fields: [] }
  ) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeApplicationFunction.edgeFunction),
      params
    })

    return (
      this.adapter?.transformLoadEdgeFunctionByEdgeApplicationFunction?.(
        edgeApplicationFunction,
        data
      ) ?? data
    )
  }

  loadEdgeFunction = async (params = { fields: [] }) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#getUrl(params.id),
      params: {
        fields: params.fields
      }
    })

    // API response has nested structure: response.data = { data: { id, name, code, ... } }
    const data = response.data?.data ?? response.data

    return this.adapter?.transformLoadEdgeFunction?.(data, params.fields) ?? data
  }

  listEdgeFunctionsDropdown = async (params = { pageSize: 10, fields: [] }) => {
    if (!params.executionEnvironment) return []

    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(),
      params
    })

    const { results, count } = data
    const dataFiltered = results?.filter(
      (values) => values.execution_environment === params.executionEnvironment
    )

    const transformed =
      this.adapter?.transformEdgeFunctionsDropdown?.(dataFiltered, params.fields) ?? results

    return {
      count,
      body: transformed
    }
  }

  listEdgeFunctions = async (params = { page: 1, pageSize: 10, fields: [] }) => {
    if (!params.executionEnvironment) return []

    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(),
      params
    })

    const { results, count } = data
    const dataFiltered = results?.filter(
      (values) => values.execution_environment === params.executionEnvironment
    )

    const transformed =
      this.adapter?.transformEdgeFunctions?.(dataFiltered, params.fields) ?? results

    return {
      count,
      body: transformed
    }
  }

  #fetchFunctionsList = async (
    params = {
      page: 1,
      pageSize: 10,
      ordering: '-last_modified'
    }
  ) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(),
      params
    })

    const { results, count } = data

    const transformed = this.adapter?.transformListEdgeFunction?.(results) ?? results

    return {
      count,
      body: transformed
    }
  }

  prefetchList = (pageSize = 10) => {
    const defaultParams = {
      page: 1,
      pageSize,
      fields: [],
      ordering: '-last_modified'
    }
    return this.usePrefetchQuery(queryKeys.edgeFunction.list(defaultParams), () =>
      this.#fetchFunctionsList(defaultParams)
    )
  }

  listEdgeFunctionsService = async (
    params = {
      page: 1,
      pageSize: 10,
      ordering: '-last_modified'
    }
  ) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeFunction.list(params),
      () => this.#fetchFunctionsList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  getEdgeFunctionFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.edgeFunction.all,
      id,
      listPath: 'body',
      select: (item) => {
        if (!item.rawData) {
          return {
            id: item.id,
            name: item.name?.text || item.name,
            active: item.status?.content === 'Active'
          }
        }

        return transformEdgeFunctionItem(item.rawData)
      }
    })
  }

  loadEdgeFunctionService = async ({ id }) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#getUrl(id)
    })

    // API response has nested structure: response.data = { data: { id, name, code, ... } }
    // We need to extract the inner data object
    const data = response.data?.data ?? response.data

    const transformed = this.adapter?.transformLoadEdgeFunction?.(data, []) ?? data

    return transformed
  }

  createEdgeFunctionsService = async (payload) => {
    const body = this.adapter?.transformPayloadEdgeFunctions?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFunction.all })

    return {
      feedback: 'Your Function has been created',
      urlToEditView: `/functions/edit/${data.data.id}`,
      functionId: data.data.id
    }
  }

  editEdgeFunctionService = async (payload) => {
    const body = this.adapter?.transformPayloadEdgeFunctions?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(payload.id),
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFunction.all })

    return 'Your Function has been updated'
  }

  deleteEdgeFunctionService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(id)
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeFunction.all })

    return 'Function successfully deleted'
  }
}

export const edgeFunctionService = new EdgeFunctionService()
