import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeVersionControlSystemBaseUrl } from './make-version-control-system-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'
export const postCallbackUrlService = async (path, body) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVersionControlSystemBaseUrl()}${path}`,
    method: 'POST',
    body: body
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The formatted error message.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return { feedback: 'Git Hub Installation successfully completed' }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
