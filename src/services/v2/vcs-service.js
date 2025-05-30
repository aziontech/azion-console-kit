export class VcsService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/vcs'
  }

  listIntegrations = async (params = { pageSize: 200 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/integrations`,
      params
    })
    return this.adapter?.transformListIntegrations?.(data.results) ?? data.results
  }

  listPlatforms = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/providers`
    })
    return this.adapter?.transformListPlatforms?.(data.results) ?? data.results
  }

  listRepositories = async (id, params = { pageSize: 200, ordering: 'name' }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/integrations/${id}/repositories`,
      params
    })
    return data.results
  }

  postCallbackUrl = async (path, body) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}${path}`,
      body
    })
    return data.results
  }
}
