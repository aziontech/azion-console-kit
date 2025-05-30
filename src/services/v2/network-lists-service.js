export class NetworkListsService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/workspace/network_lists'
  }

  listNetworkLists = async (
    params = { fields: '', search: '', ordering: '', page: 1, pageSize: 10 },
    isDropdown = false
  ) => {
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

  createNetworkLists = async (payload) => {
    const bodyRequest = this.adapter?.transformCreateNetworkList?.(payload)

    const { data: response } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: bodyRequest
    })

    return {
      feedback: 'Your network list has been created',
      urlToEditView: `/network-lists/edit/${response.data.id}`
    }
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
