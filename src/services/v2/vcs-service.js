export class VcsService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/vcs'
  }

  listEdgeFirewall = async (params = { pageSize: 100 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })
    return this.adapter?.transformListIntegrations?.(data.results) ?? data.results
  }

  createEdgeFirewall = async (body) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    const { id } = data.body

    return {
      feedback: 'Your Edge Firewall has been created',
      urlToEditView: `/edge-firewall/edit/${id}`,
      id
    }
  }
}
