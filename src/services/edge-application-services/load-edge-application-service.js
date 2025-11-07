import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'
import { queryClient } from '@/services/v2/base/query/queryClient'

const CACHE_KEY = 'edge-application-load'
const CACHE_TYPE = 'global'
const STALE_TIME = 10 * 60 * 1000 // 10 minutos
const GC_TIME = 30 * 60 * 1000 // 30 minutos

const invalidatePreviousLoadCache = async (currentId) => {
  // Remove todos os caches de load EXCETO o atual
  await queryClient.removeQueries({
    predicate: (query) => {
      const queryKey = query.queryKey
      if (!queryKey || !Array.isArray(queryKey)) return false

      const isLoadCache = queryKey[0] === CACHE_TYPE && queryKey.includes(CACHE_KEY)

      if (!isLoadCache) return false

      // Remove se NÃO for o ID atual
      const isCurrentId = queryKey.some(
        (key) => typeof key === 'string' && key === `id=${currentId}`
      )

      return !isCurrentId
    }
  })
}

export const loadEdgeApplicationService = async ({ id }) => {
  // Invalida cache do item anterior antes de carregar o novo
  await invalidatePreviousLoadCache(id)

  return queryClient.fetchQuery({
    queryKey: [CACHE_TYPE, CACHE_KEY, `id=${id}`],
    queryFn: async () => {
      let httpResponse = await AxiosHttpClientAdapter.request({
        url: `${makeEdgeApplicationBaseUrl()}/${id}`,
        method: 'GET'
      })
      httpResponse = adapt(httpResponse)
      return parseHttpResponse(httpResponse)
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    meta: {
      persist: true // Persiste apenas o último item carregado
    }
  })
}

const adapt = (httpResponse) => {
  const body = httpResponse.body?.results
  let responseData = {
    body: [],
    statusCode: httpResponse.statusCode
  }

  if (!body) return responseData

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

  responseData.body = parsedBody

  return responseData
}

const HTTP_PORT_LIST_OPTIONS = [
  { name: '80 (Default)', value: '80' },
  { name: '8008', value: '8008' },
  { name: '8080', value: '8080' },
  { name: '8880', value: '8880' }
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
