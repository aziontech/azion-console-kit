export class HttpService {
  constructor({ httpClient, abortManager, buildQueryParams, errorHandler }) {
    this.httpClient = httpClient
    this.abortManager = abortManager
    this.errorHandler = errorHandler
    this.buildQueryParams = buildQueryParams
  }

  async request({ method, url, body = {}, params = {}, config = {}, abortIdentifier, abortGroup }) {
    let signal
    if (abortIdentifier || abortGroup) {
      signal = this.abortManager.getSignal(abortIdentifier, abortGroup)
    }

    let requestUrl = url
    if (Object.keys(params).length > 0) {
      const paramsString = this.buildQueryParams(params)
      if (paramsString) {
        requestUrl = `${url}?${paramsString}`
      }
    }

    try {
      const response = await this.httpClient.send({
        method,
        data: body,
        url: requestUrl,
        ...(signal && { signal }),
        ...config
      })
      const { data, status } = response
      return { data, status }
    } catch (error) {
      const errors = this.errorHandler?.(error)
      throw errors
    }
  }

  abort(abortIdentifier) {
    this.abortManager.abort(abortIdentifier)
  }

  abortGroup(groupName) {
    this.abortManager.abortGroup(groupName)
  }
}
