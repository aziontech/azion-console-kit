export class VcsService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/vcs'
  }

  async listIntegrations(params = { pageSize: 200 }) {
    const res = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/integrations`,
      params
    })
    console.log('🚀 ~ VcsService ~ listIntegrations ~ res:', res);
    return res.success ? this.adapter?.transformListIntegrations?.(res) : res
  }

  async listPlatforms() {
    const res = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/providers`
    })
    console.log('🚀 ~ VcsService ~ listPlatforms ~ res:', res);
    return res.success ? this.adapter?.transformListPlatforms?.(res) : res
  }

  async listRepositories(id, params = { pageSize: 200, ordering: 'name' }) {
    const res = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/integrations/${id}/repositories`,
      params
    })
    console.log('🚀 ~ VcsService ~ listRepositories ~ res:', res);
    return res.success ? this.adapter?.transformListRepositories?.(res) ?? res : res
  }

  async postCallbackUrl(path, body) {
    const res = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}${path}`,
      body
    })
    console.log('🚀 ~ VcsService ~ postCallbackUrl ~ res:', res);
    return res
  }
}
