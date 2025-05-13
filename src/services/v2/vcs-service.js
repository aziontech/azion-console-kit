export class VcsService {
  constructor(http, adapter, requestParams) {
    this.http = http
    this.adapter = adapter
    this.requestParams = requestParams
    this.apiVersion = 'v4'
  }

  async getPlatforms(params) {
    const searchParams = this.requestParams(params)
    const res = await this.http.request({ 
      method: 'get',
      url: `${this.apiVersion}/vcs/providers?${searchParams}`,
    })
    return this.adapter?.transformGetPlatforms?.(res) ?? res
  }

  async getIntegrations() {
    const searchParams = this.requestParams(params)
    const res = await this.http.request({
      method: 'get',
      url: `${this.apiVersion}/vcs/integrations?${searchParams}`,
    })
    return this.adapter?.transformGetIntegrations?.(res) ?? res
  }

  async getIntegrationRepositories(id, params) {
    const searchParams = this.requestParams(params)
    const res = await this.http.request({
      method: 'get',
      url: `${this.apiVersion}/vcs/integrations/${id}/repositories?${searchParams}`,
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

  abortGetRepositories(id) {
    this.http.abort(`getRepositories-${id}`)
  }

  abortAll() {
    this.http.abortAll()
  }
}
