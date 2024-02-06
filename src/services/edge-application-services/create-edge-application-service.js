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
  return {
    name: payload.name,
    delivery_protocol: payload.deliveryProtocol,
    http3: payload.http3,
    http_port: payload.httpPort.value.value,
    https_port: payload.httpsPort.value,
    minimum_tls_version: payload.minimumTlsVersion.value,
    origin_type: payload.originType.value,
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
      throw new Error(Object.keys(httpResponse.body)[0]).message
    case 409:
      throw new Error(Object.keys(httpResponse.body)[0]).message
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
