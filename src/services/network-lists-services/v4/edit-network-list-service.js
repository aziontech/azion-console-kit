import { AxiosHttpClientAdapter } from '../../axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from './make-network-list-service'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const editNetworkListService = async (payload) => {
  const bodyRequest = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}/${payload.id}`,
    method: 'PUT',
    body: bodyRequest
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  let networkContentList = null
  if (payload.networkListType !== 'countries') {
    networkContentList = payload.itemsValues.trim().split('\n')
  } else {
    networkContentList = payload.itemsValuesCountry
  }
  return {
    name: payload.name,
    type: payload.networkListType,
    items: networkContentList
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
    case 202:
      return 'Your network list has been edited'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
