import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeConnectorsV4BaseUrl } from './make-edge-connectors-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

/**
 * Deletes an Edge Connector.
 *
 * @param {string} edgeConnectorId - The id of the Edge Connector.
 * @returns {Promise<string>} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
export const deleteEdgeConnectorsService = async (edgeConnectorId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeConnectorsV4BaseUrl()}/${edgeConnectorId}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Resource successfully deleted'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
