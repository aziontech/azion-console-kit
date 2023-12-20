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
    httpPort: HTTP_PORT_LIST_OPTIONS.find((el) => el.value == body.http_port[0]),
    httpsPort: HTTPS_PORT_LIST_OPTIONS.find((el) => el.value == body.https_port[0]),
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

const HTTP_PORT_LIST_OPTIONS = [
  { label: '80 (Default)', value: '80' },
  { label: '8008', value: '8008' },
  { label: '8080', value: '8080' }
]
const HTTPS_PORT_LIST_OPTIONS = [
  { label: '443 (Default)', value: '443' },
  { label: '8443', value: '8443' },
  { label: '9440', value: '9440' },
  { label: '9441', value: '9441' },
  { label: '9442', value: '9442' },
  { label: '9443', value: '9443' }
]
