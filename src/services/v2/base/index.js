import axios from 'axios'
import { errorHandler } from '../utils/errorHandler'
import { AbortManager } from './abortManager'
import { HttpClient } from './httpClient'
import { HttpService } from './httpService'

const abortManager = new AbortManager()
const httpClient = new HttpClient((config) => axios(config))
const httpService = new HttpService({
  httpClient,
  abortManager,
  errorHandler
})

import { VcsAdapter } from '../adapters/vcs-adapter'
import { VcsService } from '../vcs-service'

export const vcsServices = new VcsService(httpService, VcsAdapter)
