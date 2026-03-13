import { httpService } from '@/services/v2/base/http/httpService'
import { ScriptRunnerAdapter } from './script-runner-adapter'
import * as Errors from '@/services/axios/errors'

export class ScriptRunnerService {
  constructor() {
    this.adapter = ScriptRunnerAdapter
    this.baseURL = 'script-runner'
  }

  #getUrl(id, suffix = '') {
    if (!id) {
      return `${this.baseURL}${suffix}`
    }
    return `${this.baseURL}/${id}${suffix}`
  }

  getLogsService = async (executionId) => {
    const { data } = await httpService.request({
      method: 'GET',
      url: this.#getUrl(null, `/executions/${executionId}/logs`)
    })

    return this.adapter.transformLogsResponse(data)
  }

  checkStatusService = async (executionId) => {
    const { data } = await httpService.request({
      method: 'GET',
      url: this.#getUrl(null, `/executions/${executionId}/status`)
    })

    return this.adapter.transformStatusResponse(data)
  }

  loadExecutionResultsService = async (executionId) => {
    const { data, statusCode } = await httpService.request({
      method: 'GET',
      url: this.#getUrl(null, `/executions/${executionId}/results`)
    })

    return this.#parseHttpResponse(data, statusCode)
  }

  #parseHttpResponse(data, statusCode) {
    switch (statusCode) {
      case 200: {
        const hasErrors = data.result?.errors || data.result?.error
        if (hasErrors) {
          throw new Error(data.result?.message).message
        }
        return this.adapter.transformExecutionResultsResponse(data)
      }
      case 400:
        throw new Errors.NotFoundError().message
      case 401:
        throw new Errors.InvalidApiTokenError().message
      case 403:
        throw new Errors.PermissionError().message
      case 404:
        throw new Errors.NotFoundError().message
      case 500:
        throw new Errors.InternalServerError().message
      default:
        throw new Errors.UnexpectedError().message
    }
  }
}

export const scriptRunnerService = new ScriptRunnerService()
