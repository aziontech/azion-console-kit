import { HttpService } from './httpService'
import { AbortManager } from './abortManager'
import { HttpClient } from './httpClient'

import { buildQueryParams, errorHandler } from '../utils'

export const createHttpService = () => {
  const abortManager = new AbortManager()
  const httpClient = new HttpClient()

  return new HttpService({
    httpClient,
    abortManager,
    buildQueryParams,
    errorHandler
  })
}
