export class CustomPageService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/workspace/custom_pages'
  }

  listCustomPagesService = async (params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { count, results } = data
    const body = this.adapter?.transformListCustomPage?.(results, params.fields) ?? results
    return {
      body,
      count
    }
  }

  createCustomPagesService = async (payload) => {
    const body = this.adapter?.transformPayloadCustomPage?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    return data
  }

  editCustomPagesService = async (payload) => {
    const body = this.adapter?.transformPayloadCustomPage?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    return 'Your Custom Page has been updated!'
  }

  loadCustomPagesService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter?.transformLoadCustomPage?.(data) ?? data.data
  }

  deleteCustomPagesService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    return 'Custom Page successfully deleted!'
  }
}
