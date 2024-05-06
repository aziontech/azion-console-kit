import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeWafRulesAllowedBaseUrl } from './make-waf-rules-allowed-base-url'

export const createWafRulesAllowedTuningService = async ({ attackEvents, wafId, reason }) => {

  const requestsAllowedRules = attackEvents.map(async (attack) => {
    let matchZones = {
      zone: attack.matchZone,
      matches_on: attack.matchesOn
    }

    if (attack.matchValue) {
      const isPathZone = matchZones.zone === 'path'

      matchZones.zone_input = attack.matchValue
      matchZones.zone = isPathZone ? 'path' : `conditional_${matchZones.zone}`
      matchZones.zone_input = isPathZone ? null : matchZones.zone_input
    }

    const payload = {
      rule_id: attack.ruleId,
      match_zones: [matchZones],
      reason
    }

    const httpResponse = await AxiosHttpClientAdapter.request({
      url: `${makeWafRulesAllowedBaseUrl()}/${wafId}/allowed_rules`,
      method: 'POST',
      body: payload
    })

    return parseHttpResponse(httpResponse)
  })

  return Promise.allSettled(requestsAllowedRules)
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
      return 'Your waf rule allowed has been created'
    case 400:
      const apiError = extractApiError(httpResponse)
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

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {

  if (typeof errorSchema[key][0] === 'string') {
    return `${key}: ${errorSchema[key]}`
  }
  const keyValuePair = []
  errorSchema[key].forEach((obj) => {
    for (let key in obj) {
      // eslint-disable-next-line no-prototype-builtins
      if (obj.hasOwnProperty(key)) {
        keyValuePair.push({ key, value: obj[key][0] })
      }
    }
  })

  return `${keyValuePair[0].key}: ${keyValuePair[0].value}`
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const [firstKey] = Object.keys(httpResponse.body)
  const errorMessage = extractErrorKey(httpResponse.body, firstKey)

  return errorMessage
}
