import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from './make-edge-firewall-base-url'

export const editEdgeFirewallService = async (payload) => {
  const parsedPayload = adapt(payload)

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    is_active: payload.isActive,
    edge_functions_enabled: payload.edgeFunctionsEnabled,
    network_protection_enabled: payload.networkProtectionEnabled,
    waf_enabled: payload.wafEnabled,
    debug_rules: payload.debugRules
  }
}

const mapErrorToMessage = (error) => {
  switch (error) {
    case 'duplicated_edge_firewall_name':
      return 'Edge Firewall cannot be edited because it already exists'
    case 'no_modules_enabled':
      return 'Edge Firewall cannot be edited because no modules are enabled'
    case 'domains_already_in_use':
      return 'Edge Firewall cannot be edited because the domains are already in use'
    case 'has_functions_instances':
      return 'Cannot disable Edge Functions because Edge Firewall is using at least one function.'
    case 'solution_in_use':
      return 'It was not possible to perform this operation. To disable "Web Application Firewall", you must first remove all settings on this RuleSet that require it.'
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
    case 200:
      return 'Your edge firewall has been updated'
    case 400:
      const apiError400 = extractApiError(httpResponse)
      throw new Error(apiError400).message
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
