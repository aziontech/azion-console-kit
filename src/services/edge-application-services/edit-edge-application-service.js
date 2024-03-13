/**
 * @typedef {Object} EditEdgeApplicationPayload
 * @property {string} id - The ID of the application.
 * @property {string} name - The name of the application.
 * @property {string} deliveryProtocol - The delivery protocol.
 * @property {boolean} http3 - Whether HTTP3 is enabled.
 * @property {Object} httpPort - The HTTP port value.
 * @property {Object} httpsPort - The HTTPS port value.
 * @property {string} minimumTlsVersion - The minimum TLS version.
 * @property {boolean} active - Whether the application is active.
 * @property {Object} debugRules - The debug rules.
 * @property {string[]} supportedCiphers - The supported ciphers.
 * @property {boolean} applicationAccelerator - Whether application acceleration is enabled.
 * @property {boolean} deviceDetection - Whether device detection is enabled.
 * @property {boolean} edgeFunctions - Whether edge functions are enabled.
 * @property {boolean} imageOptimization - Whether image optimization is enabled.
 * @property {boolean} l2Caching - Whether L2 caching is enabled.
 * @property {boolean} loadBalancer - Whether a load balancer is enabled.
 * @property {boolean} websocket - Whether WebSocket is enabled.
 * @property {boolean} rawLogs - Whether raw logs are enabled.
 * @property {boolean} webApplicationFirewall - Whether web application firewall is enabled.
 */

import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'

/**
 * Edits an edge application.
 * @param {EditEdgeApplicationPayload} payload - The payload for editing the application.
 * @returns {Promise<any>} - A promise that resolves with the result of the edit operation.
 */
export const editEdgeApplicationService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

/**
 *  @param {EditEdgeApplicationPayload} payload
 */
const adapt = (payload) => {
  return {
    name: payload.name,
    delivery_protocol: payload.deliveryProtocol,
    http3: payload.http3,
    http_port: payload.httpPort.map((port) => port.value),
    https_port: payload.httpsPort.map((port) => port.value),
    minimum_tls_version:
      Object.values(payload.minimumTlsVersion).length > 0 ? payload.minimumTlsVersion.value : '',
    active: payload.active,
    debug_rules: payload.debugRules,
    supported_ciphers: payload.supportedCiphers,
    application_acceleration: payload.applicationAccelerator,
    device_detection: payload.deviceDetection,
    edge_firewall: false,
    edge_functions: payload.edgeFunctions,
    image_optimization: payload.imageOptimization,
    l2_caching: payload.l2Caching,
    load_balancer: payload.loadBalancer,
    websocket: payload.websocket,
    raw_logs: payload.rawLogs,
    web_application_firewall: payload.webApplicationFirewall
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const errorKeys = Object.keys(httpResponse.body)
  const noProductErrorFound = errorKeys.includes('user_has_no_product')

  if (noProductErrorFound) {
    const noProductErrorMessage =
      'In order to perform this action, you must first have access to the product Tiered Cache'
    return noProductErrorMessage
  }
  const [firstError] = errorKeys
  const errorMessage = httpResponse.body[firstError]

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
    case 200:
      return 'Your edge application has been updated'
    case 400:
      throw new Error(extractApiError(httpResponse)).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 409:
      throw new Error(Object.keys(httpResponse.body)[0]).message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
