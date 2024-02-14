import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makePasswordSettingServiceBaseUrl } from './make-password-setting-service-base-url'

export const passwordSettingService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: makePasswordSettingServiceBaseUrl(),
    method: 'POST',
    body: payload
  })
  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {Object} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return httpResponse.body
    case 400:
      throw new Error(extractApiError(httpResponse.body, 'non_field_errors')).message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Error(extractApiError(httpResponse.body, 'detail')).message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (errorSchema, key) => {
  const errorMessage = errorSchema[key] || 'Unexpected error.'

  if (errorMessage === 'Not found.') {
    return 'Token not found.'
  }

  return errorMessage
}
