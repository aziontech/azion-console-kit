import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from '../../edge-firewall-services/v4/make-edge-firewall-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import * as Errors from '@/services/axios/errors'

export const reorderEdgeFirewallRulesEngine = async (
  newOrderData,
  currentOrderData,
  edgeFirewallId
) => {
  const edgeFirewallIds = await allEdgeFirewallToReorder(edgeFirewallId)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallId}/rules/order`,
    method: 'PUT',
    body: adapt(newOrderData, currentOrderData, edgeFirewallIds)
  })

  return parseHttpResponse(httpResponse)
}

const allEdgeFirewallToReorder = async (edgeFirewallId) => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallId}/rules`,
    method: 'GET'
  })

  return httpResponse.body.results
}

function replaceIntervalWithSortedList(currentList, allIdsList, sortedList) {
  const startIndex = allIdsList.indexOf(currentList[0])
  console.log('🚀 ~ replaceIntervalWithSortedList ~ startIndex:', startIndex);
  const endIndex = allIdsList.indexOf(currentList[currentList.length - 1])
  console.log('🚀 ~ replaceIntervalWithSortedList ~ endIndex:', endIndex);

  const updatedAllIdsList = [
    ...allIdsList.slice(0, startIndex),
    ...sortedList,
    ...allIdsList.slice(endIndex + 1)
  ]

  return updatedAllIdsList
}

const adapt = (newOrderData, currentOrderData, edgeFirewallIds) => {
  const listNewOrderDataIds = newOrderData.map((data) => data.id)
  const listCurrentOrderDataIds = currentOrderData.map((data) => data.id)
  const listEdgeFirewallIds = edgeFirewallIds.map((data) => data.id)

  const result = replaceIntervalWithSortedList(
    listCurrentOrderDataIds,
    listEdgeFirewallIds,
    listNewOrderDataIds
  )

  return { order: result }
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
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Rules Engine successfully ordered'
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
