export class HttpClient {
  constructor(api, token = null) {
    this.api = api
    this.token = token
  }

  setToken(token) {
    this.token = token
  }

  async send(config) {
    const headers = config.headers || {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return this.api({ ...config, headers })
  }
}
