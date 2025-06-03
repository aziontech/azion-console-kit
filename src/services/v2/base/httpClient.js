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

    // Set default headers
    headers['Accept'] = config.accept ?? 'application/json; version=3'
    headers['Content-Type'] = config.contentType ?? 'application/json; version=3'
    headers['withCredentials'] = config.withCredentials ?? true

    // Add authentication if token is available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const requestConfig = {
      ...config,
      headers,
      baseURL
    }

    return this.api(requestConfig)
  }
}
