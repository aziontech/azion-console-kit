import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'

export const editEdgeApplicationService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    delivery_protocol: payload.deliveryProtocol,
    http3: payload.http3,
    http_port: payload.httpPort.map((port) => port.value),
    https_port: payload.httpsPort.map((port) => port.value),
    minimum_tls_version: payload.minimumTlersion,
    active: payload.active,
    debug_rules: payload.debugRules,
    supported_ciphers: payload.supportedCiphers,
    application_acceleration: payload.applicationAcceleration,
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
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return 'Your edge application has been updated'
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
