import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import * as Errors from '@/services/axios/errors'
import { adaptBehavior } from './helper-behavior'

export const createRulesEngineService = async (payload) => {
  const { edgeApplicationId, phase } = payload
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${edgeApplicationId}/rules_engine/${phase}/rules`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse, edgeApplicationId)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    phase: payload.phase,
    criteria: payload.criteria,
    behaviors: adaptBehavior(payload.behaviors),
    is_active: payload.isActive,
    description: payload.description
  }
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
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Your Rules Engine has been created.'
      }
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
