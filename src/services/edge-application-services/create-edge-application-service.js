import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'
import * as Errors from '@/services/axios/errors'

export const createEdgeApplicationService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  const deliveryProtocol =
    payload.deliveryProtocol === 'http3' ? 'http,https' : payload.deliveryProtocol

  return {
    name: payload.name,
    delivery_protocol: deliveryProtocol,
    http3: payload.http3,
    http_port: payload.httpPort.map((port) => port.value),
    https_port: payload.httpsPort.map((port) => port.value),
    minimum_tls_version: payload.minimumTlsVersion,
    supported_ciphers: payload.supportedCiphers,
    origin_type: payload.originType,
    address: payload.address,
    origin_protocol_policy: payload.originProtocolPolicy,
    host_header: payload.hostHeader,
    browser_cache_settings: payload.browserCacheSettings,
    browser_cache_settings_maximum_ttl: payload.browserCacheSettingsMaximumTtl
      ? payload.browserCacheSettingsMaximumTtl
      : 0,
    cdn_cache_settings: payload.cdnCacheSettings,
    cdn_cache_settings_maximum_ttl: payload.cdnCacheSettingsMaximumTtl,
    debug_rules: payload.debugRules
  }
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  if (typeof errorSchema[key] === 'string') {
    return `${key}: ${errorSchema[key]}`
  }
  return `${key}: ${errorSchema[key][0]}`
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
        feedback: 'Your edge application has been created',
        urlToEditView: `/edge-applications/edit/${httpResponse.body.results.id}`
      }
    case 400:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
    case 409:
      const apiErro = extractApiError(httpResponse)
      throw new Error(apiErro).message
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
