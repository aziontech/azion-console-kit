import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import * as Errors from '@/services/axios/errors'

export const editRulesEngineService = async ({ id, payload, reorder = false }) => {
  const parsedPayload = adapt(payload, reorder)

  const rulesPhase =
    payload.phase.content === 'Default' ? 'request' : payload.phase.content?.toLowerCase()

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/rules_engine/${rulesPhase}/rules/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload, reorder) => {
  let parsedPaylod

  if (!reorder) {
    const { name, phase, behaviors, criteria, isActive, description } = payload
    parsedPaylod = {
      name,
      phase: phase.content,
      behaviors,
      criteria,
      is_active: isActive,
      description
    }
  } else {
    parsedPaylod = {
      order: parseInt(payload.order)
    }
  }

  return parsedPaylod
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  if (Array.isArray(errorSchema[key])) {
    return errorSchema[key]?.[0]
  }
  return errorSchema[key]
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const errorKey = Object.keys(httpResponse.body)[0]
  const apiError = extractErrorKey(httpResponse.body, errorKey)
  return `${errorKey}: ${apiError}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return 'Your Rules Engine has been edited'
    case 400:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
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
