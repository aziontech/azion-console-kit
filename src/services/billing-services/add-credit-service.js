import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makePaymentBaseUrl } from './make-payment-base-url'
import * as Errors from '@/services/axios/errors'

export const addCreditService = async ({ amount }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePaymentBaseUrl()}/credits`,
    method: 'POST',
    body: { amount }
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const [key] = Object.keys(httpResponse.body)
  const errorMessage = httpResponse.body[key]

  return errorMessage
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return 'Credit added successfully.'
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
