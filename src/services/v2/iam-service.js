export class IAMService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/iam/identity_providers/social'
  }

  listSocialIdps = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      body: {}
    })

    return this.adapter?.transformListSocialIdps?.(data)
  }
}
