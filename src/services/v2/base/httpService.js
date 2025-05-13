export class HttpService {
  constructor({ httpClient, abortManager, errorHandler }) {
    this.httpClient = httpClient
    this.abortManager = abortManager
    this.errorHandler = errorHandler
  }

  async request({ method, url, data = {}, params = {}, config = {}, abortIdentifier, abortGroup }) {
    const signal = this.abortManager.getSignal(abortIdentifier, abortGroup)
    try {
      const response = await this.httpClient.send({ method, url, data, params, signal, ...config })
      return response.data
    } catch (error) {
      this.errorHandler?.(error)
      throw error
    }
  }

  abort(abortIdentifier) {
    this.abortManager.abort(abortIdentifier)
  }

  abortGroup(groupName) {
    this.abortManager.abortGroup(groupName)
  }
}
