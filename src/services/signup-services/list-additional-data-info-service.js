import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeAdditionalDataBaseUrl } from './make-additional-data-base-url'

export const listAdditionalDataInfoService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAdditionalDataBaseUrl()}`,
    method: 'GET'
  })

  return parseHttpResponse(httpResponse)
}

const adapt = ([...response]) => {
  /* 
    this adaptation is required to handle the missing fullname field in the v4 api
    and use progressive indexes in components when rendering the ui.
  */

  const indexToInsertFullName = 3

  // this id does not affect the use in the app. It is high just to avoid possible colisions
  const fullNameField = { id: 999, key: 'Full Name', required: true, show: true }

  response.splice(indexToInsertFullName, 0, fullNameField)

  return response
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
      return adapt(httpResponse.body.results)
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
