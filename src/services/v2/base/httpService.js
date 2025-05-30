export class HttpService {
  constructor({ httpClient, abortManager, buildQueryParams, errorHandler }) {
    this.httpClient = httpClient
    this.abortManager = abortManager
    this.errorHandler = errorHandler
    this.buildQueryParams = buildQueryParams
  }

  #buildRequestUrl(url, params) {
    if (!Object.keys(params).length) return url

    const paramsString = this.buildQueryParams(params)
    return paramsString ? `${url}?${paramsString}` : url
  }

  #getSignal(abortIdentifier, abortGroup) {
    if (!abortIdentifier && !abortGroup) return null
    return this.abortManager.getSignal(abortIdentifier, abortGroup)
  }

  async request({ method, url, body = {}, params = {}, config = {}, abortIdentifier, abortGroup }) {
    const signal = this.#getSignal(abortIdentifier, abortGroup)
    const requestUrl = this.#buildRequestUrl(url, params)

    try {
      const response = await this.httpClient.send({
        method,
        data: body,
        url: requestUrl,
        ...(signal && { signal }),
        ...config
      })

      return response
    } catch (error) {
      throw this.errorHandler.create(error)
    }
  }

  abort(abortIdentifier) {
    this.abortManager.abort(abortIdentifier)
  }

  abortGroup(groupName) {
    this.abortManager.abortGroup(groupName)
  }
}
