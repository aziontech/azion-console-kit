import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeScriptRunnerBaseUrl } from './make-script-runner-base-url'
import * as Errors from '@/services/axios/errors'

export const instantiateScript = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeScriptRunnerBaseUrl()}/executions`,
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
      case 201:
        return 'Script instantiated'
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