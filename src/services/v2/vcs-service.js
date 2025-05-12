export class VcsService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.apiVersion = 'v4'
  }

  async getPlatforms() {
    const res = await this.http.request({ method: 'get', url: `${this.apiVersion}/vcs/providers` })
    return this.adapter?.transformGetPlatforms?.(res) ?? res
  }

  async getIntegrations() {
    const res = await this.http.request({
      method: 'get',
      url: `${this.apiVersion}/vcs/integrations`,
      params: { page_size: 200 }
    })
    return this.adapter?.transformGetIntegrations?.(res) ?? res
  }

  async getIntegrationRepositories(id, { pageSize = 200, ordering = 'name' } = {}) {
    const params = new URLSearchParams()
    params.set('page_size', pageSize)
    params.set('ordering', ordering)

    const res = await this.http.request({
      method: 'get',
      url: `${this.apiVersion}/vcs/integrations/${id}/repositories`,
      params: params.toString()
    })
    return this.adapter?.transformGetIntegrationRepositories?.(res) ?? res
  }

  async postCallbackUrl(path, body) {
    const res = await this.http.request({
      method: 'post',
      url: `${this.apiVersion}/vcs${path}`,
      body
    })
    return this.adapter?.transformPostCallbackUrl?.(res) ?? res
  }

  abortGetRepositories(params) {
    this.http.abort('get', '/vcs/repositories', params)
  }
}
