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
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  return errorSchema[key]?.[0]
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const errors = extractErrorKey(httpResponse.body, 'errors')
  return errors
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
        feedback: 'Your Credit Card has been added',
        token: httpResponse.body.token
      }
    case 400:
      const apiError400 = extractApiError(httpResponse)
      throw new Error(apiError400).message
    case 422:
      const apiError422 = extractApiError(httpResponse)
      throw new Error(apiError422).message
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