import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from './make-edge-firewall-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

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
  return {
    name: payload.name,
    active: payload.isActive,
    modules: {
      ddos_protection_enabled: true,
      edge_functions_enabled: payload.edgeFunctionsEnabled,
      network_protection_enabled: payload.networkProtectionEnabled,
      waf_enabled: payload.wafEnabled
    },
    debug_rules: payload.debugRules
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The formatted error message.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      const { id } = httpResponse.body.data
      return {
        feedback: 'Your Edge Firewall has been created',
        urlToEditView: `/edge-firewall/edit/${id}`,
        id
      }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}