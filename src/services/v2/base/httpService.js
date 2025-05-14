export class HttpService {
  constructor({ httpClient, abortManager, buildQueryParams, errorHandler }) {
    this.httpClient = httpClient
    this.abortManager = abortManager
    this.errorHandler = errorHandler
    this.buildQueryParams = buildQueryParams
  }

  async request({ method, url, body = {}, params = {}, config = {}, abortIdentifier, abortGroup }) {
    const signal = this.abortManager.getSignal(abortIdentifier, abortGroup)
    const paramsString = this.buildQueryParams(params)
    try {
      const response = await this.httpClient.send({
        method,
        data: body,
        url: `${url}${paramsString ? `?${paramsString}` : ''}`,
        signal,
        ...config
      })
      return {
        body: response.data,
        statusCode: response.status
      }
    } catch (error) {
      const errors = this.errorHandler?.(error)
      return {
        body: errors,
        statusCode: errors.status
      }
    }
  }

  abort(abortIdentifier) {
    this.abortManager.abort(abortIdentifier)
  }

  abortGroup(groupName) {
    this.abortManager.abortGroup(groupName)
  }
}
