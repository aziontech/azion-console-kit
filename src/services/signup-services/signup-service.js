import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeSignupBaseUrl } from './make-signup-base-url'
import * as Errors from '@/services/axios/errors'

export const signupService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeSignupBaseUrl()}`,
    method: 'POST',
    body: payload
  })
  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {String || null} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return null
    case 400:
      const apiError = Object.values(httpResponse.body)[0][0]
      throw new Error(apiError).message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
