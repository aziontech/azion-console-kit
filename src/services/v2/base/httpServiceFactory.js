import { HttpService } from './httpService'
import { AbortManager } from './abortManager'
import { HttpClient } from './httpClient'
import axios from 'axios'

import { buildQueryParams, errorHandler } from '../utils'

export const createHttpService = () => {
  const abortManager = new AbortManager()
  const httpClient = new HttpClient((config) => axios(config))

  return new HttpService({
    httpClient,
    abortManager,
    buildQueryParams,
    errorHandler
  })
}
