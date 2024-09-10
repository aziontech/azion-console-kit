import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import * as Errors from '@/services/axios/errors'

export const createDeviceGroupService = async (payload) => {
  const { edgeApplicationId } = payload
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${edgeApplicationId}/device_groups`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse, edgeApplicationId)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    user_agent: payload.userAgent
  }
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  if (Array.isArray(errorSchema[key])) {
    if (typeof errorSchema[key][0] === 'object') {
      const newError = errorSchema[key][0]
      const errorKey = Object.keys(errorSchema[key][0])
      return newError[errorKey]?.[0]
    }
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
    case 201:
      return {
        feedback: 'Your Device Group has been created'
      }
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
      const apiError500 = extractApiError(httpResponse)
      throw new Error(apiError500).message
    default:
      throw new Errors.UnexpectedError().message
  }
}
