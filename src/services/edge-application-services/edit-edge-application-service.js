import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export const editEdgeApplicationService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  const result = parseHttpResponse(httpResponse)

  await queryClient.removeQueries({ queryKey: queryKeys.edgeAppV3.all })
  await queryClient.removeQueries({ queryKey: queryKeys.edgeApp.all })

  return result
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
    minimum_tls_version: payload.minimumTlsVersion === 'none' ? '' : payload.minimumTlsVersion,
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

const extractErrorKey = (errorSchema, key) => {
  if (key === 'user_has_no_product') {
    const isWebSocket = errorSchema?.[key]?.includes('Websocket')

    if (isWebSocket) {
      return 'WebSocket support is not available for Developer and Business plans. Please contact sales'
    }
  }

  if (typeof errorSchema[key] === 'string') {
    return `${key}: ${errorSchema[key]}`
  }
  return `${key}: ${errorSchema[key][0]}`
}

const extractApiError = (httpResponse) => {
  const [firstKey] = Object.keys(httpResponse.body)
  const errorMessage = extractErrorKey(httpResponse.body, firstKey)

  return errorMessage
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return 'Your Application has been updated'
    case 400:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 409:
      const apiErro = extractApiError(httpResponse)
      throw new Error(apiErro).message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
