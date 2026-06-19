import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeScriptRunnerBaseUrl } from './make-script-runner-base-url'
import * as Errors from '@/services/axios/errors'

export const loadScriptRunnerExecutionResultsService = async (executionId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeScriptRunnerBaseUrl()}/executions/${executionId}/results`,
    method: 'GET'
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { result } = httpResponse.body

  return {
    result: {
      domain: {
        id: result.domain.id,
        url: `https://${result.domain.url}`
      },
      edgeApplication: {
        id: result.edge_application.id,
        name: result.edge_application.name
      },
      extras: result.extras
    }
  }
}

// The script-runner sometimes nests the upstream provider error inside
// `result.errors.stack` as a (possibly double-encoded) JSON string. Mine the
// most specific message available, falling back to the generic envelope fields.
const extractScriptRunnerErrorMessage = (result) => {
  let parsedStack = result?.errors?.stack
  for (let attempt = 0; attempt < 2 && typeof parsedStack === 'string'; attempt++) {
    try {
      parsedStack = JSON.parse(parsedStack)
    } catch {
      break
    }
  }

  if (parsedStack && typeof parsedStack === 'object') {
    const fieldMessages = Array.isArray(parsedStack.errors)
      ? parsedStack.errors.map((error) => error?.message).filter(Boolean)
      : []
    if (fieldMessages.length) return fieldMessages.join('; ')
    if (parsedStack.message) return parsedStack.message
  }

  return result?.message || result?.errors?.message || 'Deployment failed.'
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200: {
      const result = httpResponse.body.result
      const hasErrors = result.errors || result.error
      if (hasErrors) {
        throw new Error(extractScriptRunnerErrorMessage(result)).message
      }
      return adapt(httpResponse)
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
