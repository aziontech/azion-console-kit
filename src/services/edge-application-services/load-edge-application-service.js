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
  const httpPorts = []
  const httpsPorts = []

  body.http_port.forEach((port) => {
    httpPorts.push(HTTP_PORT_LIST_OPTIONS.find((el) => el.value == port))
  })
  body.https_port.forEach((port) => {
    httpsPorts.push(HTTPS_PORT_LIST_OPTIONS.find((el) => el.value == port))
  })

  const isHttp3Protocol = body.delivery_protocol === 'http,https' && body.http3
  const deliveryProtocol = isHttp3Protocol ? 'http3' : body.delivery_protocol

  const parsedBody = {
    id: body.id,
    name: body.name,
    deliveryProtocol: deliveryProtocol,
    httpPort: httpPorts,
    httpsPort: httpsPorts,
    minimumTlsVersion: body.minimum_tls_version || 'none',
    active: body.active,
    debugRules: body.debug_rules,
    http3: body.http3,
    websocket: body.websocket,
    supportedCiphers: body.supported_ciphers,
    applicationAccelerator: body.application_acceleration,
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

const HTTP_PORT_LIST_OPTIONS = [
  { name: '80 (Default)', value: '80' },
  { name: '8008', value: '8008' },
  { name: '8080', value: '8080' }
]
const HTTPS_PORT_LIST_OPTIONS = [
  { name: '443 (Default)', value: '443' },
  { name: '8443', value: '8443' },
  { name: '9440', value: '9440' },
  { name: '9441', value: '9441' },
  { name: '9442', value: '9442' },
  { name: '9443', value: '9443' },
  { name: '7777', value: '7777' },
  { name: '8888', value: '8888' },
  { name: '9553', value: '9553' },
  { name: '9653', value: '9653' },
  { name: '8035', value: '8035' },
  { name: '8090', value: '8090' }
]
