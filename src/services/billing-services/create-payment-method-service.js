import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makePaymentBaseUrl } from './make-payment-base-url'

export const createPaymentMethodService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePaymentBaseUrl()}/credit_cards`,
    method: 'POST',
    body: payload
  })

  return parseHttpResponse(httpResponse)
}

/**
/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  return `${errorSchema[key]}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const apiKeyError = Object.keys(httpResponse.body)[0]
  const apiValidationError = extractErrorKey(httpResponse.body, apiKeyError)

  return `${apiKeyError}: ${apiValidationError}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {Object} The result object with feedback message
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Your Payment Method has been added'
      }
    case 400:
      const apiError400 = extractApiError(httpResponse)
      throw new Error(apiError400).message
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
