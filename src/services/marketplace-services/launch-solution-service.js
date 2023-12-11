import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeMarketplaceBaseUrl } from './make-marketplace-base-url'

export const launchSolutionService = async ({ vendor, solution }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMarketplaceBaseUrl()}/solution/launch/${vendor}/${solution}/latest`,
    method: 'POST'
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
        feedback: 'Integration installation was successful'
      }
    case 400:
      const apiError = httpResponse.body
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
