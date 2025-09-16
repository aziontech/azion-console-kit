import axios from 'axios'

export class HttpClient {
  async send(config) {
    const headers = config.headers || {}
    const baseURL = config.baseURL ?? '/'

    headers['Accept'] = config.accept ?? 'application/json; version=3'
    headers['Content-Type'] = config.contentType ?? 'application/json; version=3'
    headers['withCredentials'] = config.withCredentials ?? true

    const requestConfig = {
      ...config,
      headers,
      baseURL
    }

    return axios(requestConfig)
  }
}
