import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from './make-network-list-base-url'
import * as Errors from '@/services/axios/errors'

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
    list_type: payload.networkListType,
    items_values: networkContentList
  }
}

/**
 * @param {Object} body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (body) => {
  for (const keyError of Object.keys(body)) {
    const errorValue = Array.isArray(body[keyError]) ? body[keyError][0] : body[keyError]
    if (typeof errorValue === 'string') return errorValue
    if (typeof errorValue === 'object' && errorValue.message) return errorValue.message[0]
  }
  return ''
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
    case 400:
      const apiError = extractApiError(httpResponse.body)
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
