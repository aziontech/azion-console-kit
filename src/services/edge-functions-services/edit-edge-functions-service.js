import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-functions-base-url'

export const editEdgeFunctionsService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFunctionsBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const definedKeys = [
    'name',
    'code',
    'language',
    'invalid_json',
    'initiator_type',
    'json_args',
    'active'
  ]
  let key = definedKeys.find((key) => httpResponse.body[key])

  // Case not found any defined key
  if (!key) {
    key = Object.keys(httpResponse.body)[0]
  }

  const value = httpResponse.body[key]
  const isString = typeof value === 'string'
  const isArray = Array.isArray(value)

  let message = ''
  if (isString) message = value
  if (isArray) message = value[0]

  return `${key}: ${message}`
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
      return 'Your edge function has been updated'
    case 400:
      const apiError400 = extractApiError(httpResponse)
      throw new Error(apiError400)
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

const adapt = (payload) => {
  return {
    name: payload.name,
    code: payload.code,
    initiator_type: payload.initiatorType,
    json_args: JSON.parse(payload.jsonArgs),
    active: payload.active
  }
}
