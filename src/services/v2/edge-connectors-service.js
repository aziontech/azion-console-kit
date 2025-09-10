export class EdgeConnectorsService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/workspace/connectors'
  }

  listEdgeConnectorsService = async (params = { pageSize: 10 }) => {
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

    return 'Edge Connector has been updated'
  }

  loadEdgeConnectorsService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter?.transformLoadEdgeConnectors?.(data) ?? data.data
  }

  deleteEdgeConnectorsService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    return 'Resource successfully deleted'
  }
}
