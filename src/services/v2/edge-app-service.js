export class EdgeAppService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_application/applications'
  }

  listEdgeApplicationsService = async (
    params = {
      pageSize: 10,
      fields: ['id', 'name', 'active', 'last_editor', 'last_modified', 'product_version']
    }
  ) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })
    const { count, results } = data

    const body = this.adapter?.transformListEdgeApp?.(results, params.fields) ?? results

    return {
      body,
      count
    }
  }

  listEdgeApplicationsServiceDropdown = async (
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
    const { count, results } = data

    const body = this.adapter?.transformListDropdownEdgeApp?.(results) ?? results

    return {
      body,
      count
    }
  }

  loadEdgeApplicationService = async ({ id, params }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`,
      params
    })

    return this.adapter?.transformLoadEdgeApp?.(data) ?? data.data
  }

  createEdgeApplicationService = async (payload) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: {
        name: payload.name
      }
    })

    return data
  }

  cloneEdgeApplicationService = async (payload) => {
    const body = this.adapter?.transformPayloadClone?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${payload.id}/clone`,
      body
    })

    return {
      feedback: 'Your edge application has been cloned',
      urlToEditView: `/edge-applications/edit/${data.data.id}`,
      applicationId: data.data.id
    }
  }

  editEdgeApplicationService = async (payload) => {
    const body = this.adapter?.transformPayloadEdit?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    return 'Your edge application has been updated'
  }

  deleteEdgeApplicationService = async (edgeApplicationId) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${edgeApplicationId}`
    })

    return 'Resource successfully deleted'
  }
}
