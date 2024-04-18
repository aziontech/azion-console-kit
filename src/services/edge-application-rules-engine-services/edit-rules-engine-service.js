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

const errorMessagesMap = {
  duplicated_behaviors: `The behavior '{value}' is duplicated.`,
  blank_parameter: `The '{value}' field is empty.`,
  incompatible_behaviors: `The behavior '{value}' is incompatible with the others.`,
  invalid_behaviors: `The behavior '{value}' is invalid.`,
  invalid_behaviors_target: `The behavior '{value}' has a invalid target.`
}

/**
 * Extracts the first error message from an error object.
 * @param {Object} errorObject - The error object to extract the message from.
 * @returns {string} The first error message found.
 */
function getFirstErrorMessage(errorObject) {
  for (let key in errorObject) {
    const errorValue = errorObject[key]
    if (typeof errorValue === 'string') {
      return errorValue
    }
    if (Array.isArray(errorValue)) {
      return processArrayError(key, errorValue)
    }
    if (typeof errorValue === 'object') {
      return getFirstErrorMessage(errorValue)
    }
  }
}

/**
 * Processes an array error to extract the error message.
 * @param {string} key - The key of the error in the error object.
 * @param {Array} errorArray - The array containing the error details.
 * @returns {string} The processed error message.
 */
function processArrayError(key, errorArray) {
  const errorMessageTemplate = errorMessagesMap[key]
  if (errorMessageTemplate) {
    let value = errorArray[0]
    if (key === 'incompatible_behaviors') {
      // Extract the behavior name from the string
      value = value.match(/\(u'(.*?)',/)[1].replace(/_/g, ' ')
    } else {
      value = value.replace(/_/g, ' ')
    }
    return errorMessageTemplate.replace('{value}', value)
  }
  return `${key}: ${errorArray[0]}`
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
      const apiError = getFirstErrorMessage(httpResponse)
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
