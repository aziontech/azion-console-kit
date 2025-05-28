export class NetworkListsService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/workspace/network_lists'
  }

  listNetworkLists = async (
    params = { fields: '', search: '', ordering: '', page: 1, pageSize: 10 }
  ) => {
    const searchParams = new URLSearchParams(params).toString()
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}?${searchParams}`
    })

    const { results, count } = data
    const transformedData = this.adapter?.transformListNetworkLists?.(results) ?? results

    return {
      count,
      body: transformedData
    }
  }

  createNetworkLists = async (payload) => {
    const bodyRequest = this.adapter?.transformCreateNetworkList?.(payload)

    const { data: response } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}`,
      body: bodyRequest
    })

    return {
      feedback: 'Your network list has been created',
      urlToEditView: `/network-lists/edit/${response.data.id}`
    }
  }

  loadNetworkList = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter?.transformLoadNetworkList?.(data) ?? data
  }

  editNetworkList = async (payload) => {
    const bodyRequest = this.adapter?.transformEditNetworkList?.(payload)

    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body: bodyRequest
    })

    return 'Your Network List has been updated.'
  }

  deleteNetworkList = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    return 'Network list successfully deleted.'
  }
}
