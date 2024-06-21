import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makePersonalTokensBaseUrl } from './make-personal-tokens-base-url'
import * as Errors from '@/services/axios/errors'

export const createPersonalToken = async (payload) => {
  const { name, description, expiresAt } = payload

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePersonalTokensBaseUrl()}`,
    method: 'POST',
    body: {
      name,
      description,
      expires_at: expiresAt
    }
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
    case 201:
      return {
        feedback: 'Personal token has been created',
        token: httpResponse.body.key,
        urlToEditView: '/personal-tokens'
      }
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
