import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import * as Errors from '@/services/axios/errors'

export const editRulesEngineService = async ({ id, payload, reorder = false }) => {
  const parsedPayload = adapt(payload, reorder)

  const rulePhase = generateRulePhase(payload) || payload.phase

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/rules_engine/${rulePhase}/rules/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

/**
 *
 * @param {Object} payload
 * @param {Object} payload.phase
 * @param {string | undefined} payload.phase.content
 * @returns {string}
 */
const generateRulePhase = (payload) => {
  let rulePhase = payload.phase
  if (payload.phase?.content) {
    rulePhase = payload.phase?.content
  }

  const DEFAULT_RULE_PHASE = 'default'
  return rulePhase === DEFAULT_RULE_PHASE ? 'request' : rulePhase.toLowerCase()
}

const adapt = (payload, reorder) => {
  let parsedPayload

  if (reorder) {
    parsedPayload = {
      order: parseInt(payload.order)
    }
  } else {
    const { name, phase, behaviors, criteria, isActive, description } = payload
    parsedPayload = {
      name,
      phase: phase.content || phase,
      behaviors,
      criteria,
      is_active: isActive,
      description
    }
  }

  return parsedPayload
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
 * @param {Array} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const errorKey = Object.keys(httpResponse.body)[0]
  const apiError = extractErrorKey(httpResponse.body, errorKey)
  return `${errorKey}: ${apiError}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Array} httpResponse.body - The response body.
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
