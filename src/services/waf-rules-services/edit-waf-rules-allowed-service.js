import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeWafRulesAllowedBaseUrl } from './make-waf-rules-allowed-base-url'

export const editWafRulesAllowedService = async ({ payload, wafId, allowedId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesAllowedBaseUrl()}/${wafId}/exceptions/${allowedId}`,
    method: 'PUT',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const matchValidationValues = payload.matchZones.map((zone) => {
    if (['path', 'file_name', 'raw_body'].includes(zone.zone)) {
      zone.matches_on = null
    }
    return zone
  })
  return {
    match_zones: matchValidationValues,
    path: payload.path,
    name: payload.name,
    rule_id: payload.ruleId,
    active: payload.status,
    use_regex: payload.useRegex
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
    case 202:
      return 'Your waf rule allowed has been updated'
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

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  const [keyError] = Object.keys(errorSchema[key]?.[0])
  if (errorSchema[key]?.[0][keyError] instanceof Object) {
    return errorSchema[key]?.[0][keyError][0]
  }

  return errorSchema[key]?.[0]
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
