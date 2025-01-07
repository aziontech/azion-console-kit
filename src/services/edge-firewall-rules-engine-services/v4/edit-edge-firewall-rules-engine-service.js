import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from '../../edge-firewall-services/v4/make-edge-firewall-base-url'
import { extractApiError } from '@/helpers/extract-api-error'
import * as Errors from '@/services/axios/errors'
import { parseCriteria, parseBehaviors } from './parser-utils'

export const editEdgeFirewallRulesEngineService = async ({ edgeFirewallId, payload }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallBaseUrl()}/${edgeFirewallId}/rules/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

/**
 * Parse each behavior based on its type
 * @param {Array} behaviors
 * @returns {Array}
 */

const adapt = (payload) => {
  const parsedPayload = {
    name: payload.name,
    description: payload.description,
    active: payload.active,
    criteria: parseCriteria(payload.criteria),
    behaviors: parseBehaviors(payload.behaviors)
  }
  return parsedPayload
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
      return 'Rule Engine successfully updated'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
