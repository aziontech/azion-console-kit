import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeFunctionsAdapter } from './edge-function-adapter'

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
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(params.id),
      params: {
        fields: params.fields
      }
    })

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

  listEdgeFunctions = async (params = { pageSize: 100, fields: [] }) => {
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

  listEdgeFunctionsService = async (params = { pageSize: 100, fields: [] }) => {
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

  loadEdgeFunctionService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(id)
    })

    return this.adapter?.transformLoadEdgeFunction?.(data, []) ?? data
  }

  createEdgeFunctionsService = async (payload) => {
    const body = this.adapter?.transformPayloadEdgeFunctions?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

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

    return 'Your Function has been updated'
  }

  deleteEdgeFunctionService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(id)
    })

    return 'Function successfully deleted'
  }
}

export const edgeFunctionService = new EdgeFunctionService()
