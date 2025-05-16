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

    const baseURL = config.baseURL ?? '/'

    headers['Accept'] = config.accept ?? 'application/json; version=3'
    headers['Content-Type'] = config.contentType ?? 'application/json; version=3'
    headers['withCredentials'] = config.withCredentials ?? true

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return this.api({ ...config, headers, baseURL })
  }
}
