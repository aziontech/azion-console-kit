import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeApplicationService } from '@/services/edge-application-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationsMock: {
    id: 1731320730,
    name: 'ports',
    delivery_protocol: 'http,https',
    http_port: [80],
    https_port: [443, 7777, 8888, 9440],
    minimum_tls_version: '',
    active: true,
    debug_rules: false,
    http3: false,
    websocket: false,
    supported_ciphers: 'all',
    application_acceleration: false,
    caching: true,
    device_detection: false,
    edge_firewall: false,
    edge_functions: false,
    image_optimization: false,
    l2_caching: false,
    load_balancer: false,
    raw_logs: false,
    web_application_firewall: false
  },
  httpPort: [
    {
      name: '80 (Default)',
      value: '80'
    }
  ],
  httpsPort: [
    {
      name: '443 (Default)',
      value: '443'
    },
    {
      name: '7777',
      value: '7777'
    },
    {
      name: '8888',
      value: '8888'
    },
    {
      name: '9440',
      value: '9440'
    }
  ]
}

const makeSut = () => {
  const sut = loadEdgeApplicationService

  return {
    sut
  }
}

describe('EdgeApplicationServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.edgeApplicationsMock }
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut({ id: fixtures.edgeApplicationsMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${fixtures.edgeApplicationsMock.id}`,
      method: 'GET'
    })
  })

  it('should parsed correctly edge application', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.edgeApplicationsMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.edgeApplicationsMock.id })

    expect(result).toEqual({
      active: fixtures.edgeApplicationsMock.active,
      applicationAccelerator: fixtures.edgeApplicationsMock.application_acceleration,
      caching: fixtures.edgeApplicationsMock.caching,
      debugRules: fixtures.edgeApplicationsMock.debug_rules,
      deliveryProtocol: fixtures.edgeApplicationsMock.delivery_protocol,
      deviceDetection: fixtures.edgeApplicationsMock.device_detection,
      edgeFirewall: fixtures.edgeApplicationsMock.edge_firewall,
      edgeFunctions: fixtures.edgeApplicationsMock.edge_functions,
      http3: fixtures.edgeApplicationsMock.http3,
      httpPort: fixtures.httpPort,
      httpsPort: fixtures.httpsPort,
      id: fixtures.edgeApplicationsMock.id,
      imageOptimization: fixtures.edgeApplicationsMock.image_optimization,
      l2Caching: fixtures.edgeApplicationsMock.l2_caching,
      loadBalancer: fixtures.edgeApplicationsMock.load_balancer,
      minimumTlsVersion: 'none',
      name: fixtures.edgeApplicationsMock.name,
      rawLogs: fixtures.edgeApplicationsMock.raw_logs,
      supportedCiphers: fixtures.edgeApplicationsMock.supported_ciphers,
      webApplicationFirewall: fixtures.edgeApplicationsMock.web_application_firewall,
      websocket: fixtures.edgeApplicationsMock.websocket
    })
  })
})
