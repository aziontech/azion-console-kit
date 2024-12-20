import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallBaseUrl } from '../../edge-firewall-services/v4/make-edge-firewall-base-url'
import { extractApiError } from '@/helpers/extract-api-error'
import * as Errors from '@/services/axios/errors'

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
const parseBehaviors = (behaviors) => {
  const parsedBehaviors = behaviors.map((behavior) => {
    switch (behavior.name) {
      case 'run_function':
        return {
          name: behavior.name,
          argument: behavior.functionId
        }
      case 'set_waf_ruleset':
        return {
          name: behavior.name,
          argument: {
            mode: behavior.mode,
            id: behavior.waf_id
          }
        }
      case 'set_rate_limit':
        const typeToEnableBurstSize = 'second'
        const argument = {
          type: behavior.type,
          limit_by: behavior.limit_by,
          average_rate_limit: Number(behavior.average_rate_limit)
        }

        if (behavior.type === typeToEnableBurstSize) {
          argument.maximum_burst_size = Number(behavior.maximum_burst_size)
        }

        return {
          name: behavior.name,
          argument
        }
      case 'set_custom_response':
        return {
          name: behavior.name,
          argument: {
            status_code: behavior.status_code,
            content_type: behavior.content_type,
            content_body: behavior.content_body
          }
        }
      default:
        return {
          name: behavior.name
        }
    }
  })

  return parsedBehaviors
}

const adapt = (payload) => {
  const parsedPayload = {
    name: payload.name,
    description: payload.description,
    active: payload.active,
    criteria: payload.criteria,
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
