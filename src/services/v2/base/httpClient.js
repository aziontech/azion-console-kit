import axios from 'axios'

export class HttpClient {
  async send(config) {
    const headers = config.headers || {}
    const baseURL = config.baseURL ?? '/'

    delete axios.defaults.headers.common['Authorization']
    axios.defaults.headers.common['Accept'] = config.accept ?? 'application/json; version=3'
    axios.defaults.headers.common['Content-Type'] =
      config.contentType ?? 'application/json; version=3'
    axios.defaults.headers.common['withCredentials'] = config.withCredentials ?? true

    const requestConfig = {
      ...config,
      headers,
      baseURL
    }

    return axios(requestConfig)
  }
}

export const httpClient = new HttpClient()
