import axios from 'axios'
import { KeyBuilder } from '../utils/keyBuilder'
import { errorHandler } from '../utils/errorHandler'
import { AbortManager } from './abortManager'
import { HttpClient } from './httpClient'
import { HttpService } from './httpService'

import { VcsAdapter } from '../adapters/vcs-adapter'
import { VcsService } from '../vcs-service'

const api = (config) => axios(config)
const keyBuilder = new KeyBuilder()
const abortManager = new AbortManager(keyBuilder)
const httpClient = new HttpClient(api)
const httpService = new HttpService({
  httpClient,
  abortManager,
  errorHandler
})

export const vcsServices = new VcsService(httpService, VcsAdapter)
