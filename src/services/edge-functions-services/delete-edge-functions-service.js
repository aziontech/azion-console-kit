import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-functions-base-url'
import * as Errors from '@/services/axios/errors'

export const deleteEdgeFunctionsService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFunctionsBaseUrl()}/${id}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}

const mapErrorToMessage = (error) => {
  switch (error) {
    case 'edge_function_instantiated_error':
      return `Can't delete an edge function being used. Disable it in the edge application or edge firewall to delete it.`
    default:
      return new Errors.UnexpectedError().message
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Array} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const apiKeyError = Object.keys(httpResponse.body)[0]
  return mapErrorToMessage(apiKeyError)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 204:
      return 'Edge function successfully deleted'
    case 400:
      const apiError = extractApiError(httpResponse)
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
