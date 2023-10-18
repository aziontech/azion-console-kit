import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'

export const loadEdgeApplicationService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const body = httpResponse.body.results
  const parsedBody = {
    id: body.id,
    name: body.name,
    deliveryProtocol: body.delivery_protocol,
    httpPort: body.http_port,
    httpsPort: body.https_port,
    minimumTlsVersion: body.minimum_tls_version,
    active: body.active,
    debugRules: body.debug_rules,
    http3: body.http3,
    websocket: body.websocket,
    supportedCiphers: body.supported_ciphers,
    applicationAcceleration: body.application_acceleration,
    caching: body.caching,
    deviceDetection: body.device_detection,
    edgeFirewall: body.edge_firewall,
    edgeFunctions: body.edge_functions,
    imageOptimization: body.image_optimization,
    l2Caching: body.l2_caching,
    loadBalancer: body.load_balancer,
    rawLogs: body.raw_logs,
    webApplicationFirewall: body.web_application_firewall
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
