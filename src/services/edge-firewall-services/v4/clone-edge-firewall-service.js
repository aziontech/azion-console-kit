import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from './make-edge-firewall-base-url'

/**
 * @param {Object} payload - The HTTP request payload.
 * @param {String} payload.name
 * @returns {Promise<string>} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
export const cloneEdgeFirewallService = async ({ edgeFirewallName, payload }) => {
  const newPayload = adapt(edgeFirewallName, payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${payload.id}/clone`,
    method: 'POST',
    body: newPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (edgeFirewallName, payload) => {
  return {
    name: edgeFirewallName,
    id: payload.id
  }
}

const mapErrorToMessage = (error) => {
  switch (error) {
    case 'duplicated_edge_firewall_name':
      return 'Edge Firewall cannot be created because it already exists'
    case 'no_modules_enabled':
      return 'Edge Firewall cannot be created because no modules are enabled'
    case 'domains_already_in_use':
      return 'Edge Firewall cannot be created because the domains are already in use'
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
  if (apiKeyError === 'results') {
    return mapErrorToMessage(httpResponse.body[apiKeyError][0])
  }
  return `${httpResponse.body[apiKeyError]}`
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
      return {
        feedback: 'Your Edge Firewall has been cloned',
        urlToEditView: `/edge-firewall/edit/${httpResponse.body.data.id}`,
        id: httpResponse.body.data.id
      }
    case 400:
      const apiError400 = extractApiError(httpResponse)
      throw new Error(apiError400).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 422:
      throw new Errors.InvalidApiRequestError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
