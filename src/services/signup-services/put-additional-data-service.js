import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { parseCamelToSnake } from '@/helpers'
import { makePutAdditionalDataBaseUrl } from './make-put-additional-data-base-url'

export const putAdditionalDataService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePutAdditionalDataBaseUrl(payload.id)}`,
    method: 'PUT',
    body: parseCamelToSnake(payload)
  })
  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {String} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return null
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
