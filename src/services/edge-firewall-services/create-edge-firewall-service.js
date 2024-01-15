import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from './make-edge-firewall-base-url'

/**
 * @param {Object} payload - The HTTP request payload.
 * @param {String} payload.name
 * @returns {Promise<string>} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
export const createEdgeFirewallService = async (payload) => {
  const newPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}`,
    method: 'POST',
    body: newPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const domains = payload.domains?.map((domain) => domain.id)

  return {
    name: payload.name,
    is_active: payload.isActive,
    edge_functions_enabled: payload.edgeFunctionsEnabled,
    network_protection_enabled: payload.networkProtectionEnabled,
    waf_enabled: payload.wafEnabled,
    debug_rules: payload.debugRules,
    domains
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
        feedback: 'Your Edge Firewall has been created',
        urlToEditView: `/edge-firewall/edit/${httpResponse.body.results.id}`
      }
    case 400:
      throw new Errors.NotFoundError().message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 422:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  return errorSchema[key]?.[0]
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const nameCantBeEmptyError = extractErrorKey(httpResponse.body, 'errors')

  const errorMessages = [nameCantBeEmptyError]
  const errorMessage = errorMessages.find((error) => !!error)
  return errorMessage
}
