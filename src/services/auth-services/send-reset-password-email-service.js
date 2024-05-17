import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makePasswordSettingServiceBaseUrl } from './make-password-setting-service-base-url'

export const sendResetPasswordEmailService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePasswordSettingServiceBaseUrl()}/request`,
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
      throw new Error('Error sending email').message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
