import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeResendEmailBaseUrl } from './make-resend-email-base-url'

export const resendEmailService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeResendEmailBaseUrl()}`,
    method: 'POST',
    body: payload
  })
  return parseHttpResponse(httpResponse)
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
      return 'Email sent successfully'
    case 400:
      const apiError = httpResponse.body.email[0]
      throw new Error(apiError).message
    case 403:
      const forbiddenError = httpResponse.body.detail
      throw new Error(forbiddenError).message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
