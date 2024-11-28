import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeWafRulesAllowedBaseUrl } from './make-waf-rules-allowed-base-url'

export const createWafRulesAllowedTuningService = async ({ attackEvents, wafId, name }) => {
  const MAP_MATCH_ZONES_CONDITIONAL = {
    query_string: 'conditional_query_string',
    request_body: 'conditional_request_body',
    request_header: 'conditional_request_header',
    body: 'conditional_request_body',
    file_name: 'file_name',
    path: 'path',
    raw_body: 'raw_body',
    cookie: 'conditional_request_header'
  }

  const MAP_MATCH_ZONES = {
    query_string: 'query_string',
    request_body: 'request_body',
    request_header: 'request_header',
    body: 'request_body',
    file_name: 'file_name',
    path: 'path',
    raw_body: 'raw_body',
    cookie: 'request_header'
  }

  function checkAndReturnDefault(zone, hasMatchValue) {
    const defaultZone = 'conditional_request_header'
    const ZONES = hasMatchValue ? MAP_MATCH_ZONES_CONDITIONAL : MAP_MATCH_ZONES

    return ZONES[zone] || defaultZone
  }
  const requestsAllowedRules = attackEvents.map(async (attack) => {
    const hasMatchValue = !!attack.matchValue

    let matchZones = {
      zone: checkAndReturnDefault(attack.matchZone, hasMatchValue),
      matches_on: attack.matchesOn
    }

    if (hasMatchValue) {
      const isCookieZone = attack.matchZone === 'cookie'
      const zoneInputValue = attack.matchValue === '-' ? null : attack.matchValue

      matchZones.zone_input = isCookieZone ? 'cookie' : zoneInputValue
    }

    const payload = {
      rule_id: attack.ruleId,
      match_zones: [matchZones],
      name
    }

    const httpResponse = await AxiosHttpClientAdapter.request({
      url: `${makeWafRulesAllowedBaseUrl()}/${wafId}/exceptions`,
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
