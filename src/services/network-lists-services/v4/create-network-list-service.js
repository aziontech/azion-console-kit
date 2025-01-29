import { AxiosHttpClientAdapter } from '../../axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from './make-network-list-service'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const createNetworkListService = async (payload) => {
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}`,
    method: 'POST',
    body: bodyRequest
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    type: payload.networkListType,
    items: payload.networkContentList
  }
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
        feedback: 'Your network list has been created',
        urlToEditView: `/network-lists/edit/${httpResponse.body.data.id}`
      }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
