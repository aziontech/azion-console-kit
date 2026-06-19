import { httpService } from '@/services/v2/base/http/httpService'
import { ScriptRunnerAdapter } from './script-runner-adapter'
import * as Errors from '@/services/axios/errors'

export class ScriptRunnerService {
  constructor() {
    this.adapter = ScriptRunnerAdapter
    this.baseURL = 'api/script-runner'
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
    const { data, status } = await httpService.request({
      method: 'GET',
      url: this.#getUrl(null, `/executions/${executionId}/results`)
    })
    return this.#parseHttpResponse(data, status)
  }

  #parseHttpResponse(data, statusCode) {
    switch (statusCode) {
      case 200: {
        const hasErrors = data.result?.errors || data.result?.error
        if (hasErrors) {
          throw new Error(this.adapter.extractErrorMessage(data.result))
        }
        const transformed = this.adapter.transformExecutionResultsResponse(data)
        // A 200 without an error envelope but with no provisioned resources means
        // the deploy did not actually succeed - surface it as an error so the flow
        // stays on the deploy step instead of optimistically showing success.
        const { domain, edgeApplication } = transformed.result
        if (!domain && !edgeApplication) {
          throw new Error('Deployment did not provision any resources')
        }
        return transformed
      }
      case 400:
        throw new Errors.NotFoundError()
      case 401:
        throw new Errors.InvalidApiTokenError()
      case 403:
        throw new Errors.PermissionError()
      case 404:
        throw new Errors.NotFoundError()
      case 500:
        throw new Errors.InternalServerError()
      default:
        throw new Errors.UnexpectedError()
    }
  }
}

export const scriptRunnerService = new ScriptRunnerService()
