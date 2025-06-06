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
      feedback: 'Your edge function has been created',
      urlToEditView: `/edge-functions/edit/${data.data.id}`,
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

    return 'Your edge function has been updated'
  }

  deleteEdgeFunctionService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(id)
    })

    return 'Edge Function successfully deleted'
  }
}
