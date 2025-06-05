export class EdgeFunctionService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_functions/functions'
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
    if (!params.initiatorType) return []

    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(),
      params
    })

    const { results, count } = data
    const dataFiltered = results?.filter((values) => values.initiator_type === params.initiatorType)

    const transformed =
      this.adapter?.transformEdgeFunctionsDropdown?.(dataFiltered, params.fields) ?? results

    return {
      count,
      body: transformed
    }
  }

  listEdgeFunctions = async (params = { pageSize: 100, fields: [] }) => {
    if (!params.initiatorType) return []

    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(),
      params
    })

    const { results, count } = data
    const dataFiltered = results?.filter((values) => values.initiator_type === params.initiatorType)

    const transformed =
      this.adapter?.transformEdgeFunctions?.(dataFiltered, params.fields) ?? results

    return {
      count,
      body: transformed
    }
  }
}
