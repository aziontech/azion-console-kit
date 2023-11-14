import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeIamBaseUrl } from './make-iam-base-url'

export const listAdditionalDataInfoService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIamBaseUrl()}/additional_data`,
    method: 'GET'
  })

  return parseHttpResponse(httpResponse)
}

/**
 * Parses the HTTP response and handles different status codes.
 *
 * @param {Object} httpResponse - The HTTP response object.
 * @return {Object} httpResponse.body - The response body.
 * @throws {Error} If there is an error with the response.
 */

export const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return httpResponse.body
    case 400:
      throw new Errors.InvalidApiRequestError().message
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
