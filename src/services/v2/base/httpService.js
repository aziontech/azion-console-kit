import { HttpClient } from './httpClient'
import { AbortManager } from './abortManager'
import { buildQueryParams, errorHandler } from '../utils'

export class HttpService {
  constructor() {
    this.httpClient = new HttpClient()
    this.abortManager = new AbortManager()
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

  async request({
    method,
    url,
    body = {},
    params = {},
    config = {},
    abortIdentifier,
    abortGroup,
    processError = true
  }) {
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
    } catch (axiosError) {
      if (!processError) {
        const meta = this.errorHandler.createMeta(axiosError)
        if (meta) {
          return meta
        }
      }
      throw this.errorHandler.create(axiosError)
    }
  }

  abort(abortIdentifier) {
    this.abortManager.abort(abortIdentifier)
  }

  abortGroup(groupName) {
    this.abortManager.abortGroup(groupName)
  }
}

export const httpService = new HttpService()
