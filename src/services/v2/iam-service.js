export class IAMService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/iam/identity_providers/social'
    this._socialIdpsCache = null
  }

  listSocialIdps = async () => {
    if (this._socialIdpsCache) {
      return this._socialIdpsCache
    }

    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      body: {}
    })

    this._socialIdpsCache = this.adapter?.transformListSocialIdps?.(data)

    return this._socialIdpsCache
  }
}
