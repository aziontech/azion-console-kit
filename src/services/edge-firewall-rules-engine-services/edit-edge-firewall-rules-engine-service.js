import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFirewallRulesEngineBaseUrl } from './make-edge-firewall-rules-engine-base-url'
import * as Errors from '@/services/axios/errors'

export const editEdgeFirewallRulesEngineService = async ({ edgeFirewallId, payload }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFirewallRulesEngineBaseUrl(edgeFirewallId)}/${payload.id}`,
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
      case 'set_waf_ruleset_and_waf_mode':
        return {
          name: behavior.name,
          argument: {
            waf_mode: behavior.mode,
            set_waf_ruleset_and_waf_mode: behavior.waf_id
          }
        }
      case 'set_rate_limit':
        const typeToEnableBurstSize = 'second'
        const burstSizeByType =
          behavior.type === typeToEnableBurstSize ? behavior.maximum_burst_size : ''
        return {
          name: behavior.name,
          argument: {
            type: behavior.type,
            limit_by: behavior.limit_by,
            average_rate_limit: `${behavior.average_rate_limit}`,
            maximum_burst_size: `${burstSizeByType}`
          }
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
    is_active: payload.active,
    criteria: payload.criteria,
    behaviors: parseBehaviors(payload.behaviors)
  }
  return parsedPayload
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string} The error message.
 */
const extractFirstError = (errorSchema, key) => {
  const [firstErrorKey] = Object.keys(errorSchema[key])
  const firstInvalidValue = errorSchema[key][firstErrorKey]
  return `${firstErrorKey}:${firstInvalidValue}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const apiKeyError = Object.keys(httpResponse.body)[0]
  const apiValidationError = extractFirstError(httpResponse.body, apiKeyError)

  return `${apiValidationError} is an invalid value. Please modify it and try again.`
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
      return 'Rule Engine successfully updated'
    case 400:
      throw new Error(extractApiError(httpResponse)).message
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
