import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeResetPasswordBaseUrl } from './make-reset-password-base-url'
import * as Errors from '@/services/axios/errors'

export const sendResetPasswordEmailService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeResetPasswordBaseUrl()}/request`,
    method: 'POST',
    body: adapt(payload)
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    email: payload.email
  }
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
      return 'Email sent successfully'
    case 400:
      return 'Error sending email'
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
