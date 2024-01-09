import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeListSocialIdpsBaseUrl } from './make-list-social-idps-base-url'
import { parseSnakeToCamel } from '@/helpers'

export const listSocialIdpsService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: makeListSocialIdpsBaseUrl(),
    method: 'GET',
    body: payload
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { body } = httpResponse
  return body.map((socialIdp) => {
    return parseSnakeToCamel(socialIdp)
  })
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
      return adapt(httpResponse)
    case 400:
      throw new Errors.InvalidApiRequestError().message
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
