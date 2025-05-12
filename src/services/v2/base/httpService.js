export class HttpService {
  constructor({ httpClient, abortManager, errorHandler }) {
    this.httpClient = httpClient
    this.abortManager = abortManager
    this.errorHandler = errorHandler
  }

  async request({ method, url, data = {}, params = {}, config = {}, abortGroup }) {
    const signal = this.abortManager.getSignal(method, url, params, abortGroup)
    try {
      const response = await this.httpClient.send({ method, url, data, params, signal, ...config })
      return response.data
    } catch (error) {
      this.errorHandler?.(error)
      throw error
    }
  }

  abort(method, url, params) {
    this.abortManager.abort(method, url, params)
  }

  abortGroup(groupName) {
    this.abortManager.abortGroup(groupName)
  }
}
