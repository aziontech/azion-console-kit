import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listOriginsService } from '@/services/edge-application-origins-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  originSingleType: {
    origin_id: '111111',
    origin_key: '11111-0000-11111-111111-11111',
    name: 'Origin 2',
    origin_type: 'single_origin',
    addresses: [
      {
        address: 'httpbin.org',
        weight: null,
        server_role: 'primary',
        is_active: true
      }
    ],
    origin_protocol_policy: 'http',
    is_origin_redirection_enabled: false,
    host_header: '${host}',
    method: '',
    origin_path: '/requests',
    connection_timeout: 60,
    timeout_between_bytes: 120,
    hmac_authentication: false,
    hmac_region_name: '',
    hmac_access_key: '',
    hmac_secret_key: ''
  },
  originLiveIngestType: {
    origin_id: '111111',
    origin_key: '11111-0000-11111-111111-11111',
    name: 'Origin 2',
    origin_type: 'live_ingest',
    streaming_endpoint: 'br-east-1.azioningest.net'
  },
  originLoadBalancerType: {
    origin_id: '111111',
    origin_key: '11111-0000-11111-111111-11111',
    name: 'Origin 2',
    origin_type: 'load_balancer',
    addresses: [
      {
        address: 'httpbin.org',
        weight: 1,
        server_role: 'primary',
        is_active: true
      }
    ],
    origin_protocol_policy: 'http',
    is_origin_redirection_enabled: false,
    host_header: '${host}',
    method: '',
    origin_path: '/requests',
    connection_timeout: 60,
    timeout_between_bytes: 120,
    hmac_authentication: false,
    hmac_region_name: '',
    hmac_access_key: '',
    hmac_secret_key: ''
  }
}

const makeSut = () => {
  const sut = listOriginsService

  return { sut }
}

describe('EdgeApplicationOriginsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const version = 'v3'
    await sut({ id: edgeApplicationId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${edgeApplicationId}/origins?order_by=origin_id&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [
          fixtures.originSingleType,
          fixtures.originLoadBalancerType,
          fixtures.originLiveIngestType
        ]
      }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const result = await sut({ id: edgeApplicationId })
    const [singleType, loadBalancerType, liveIngestType] = result

    expect(singleType).toEqual({
      id: fixtures.originSingleType.origin_key,
      originKey: {
        content: fixtures.originSingleType.origin_key
      },
      originId: fixtures.originSingleType.origin_id,
      name: fixtures.originSingleType.name,
      originType: 'Single Origin',
      addresses: ['httpbin.org'],
      originProtocolPolicy: fixtures.originSingleType.origin_protocol_policy,
      isOriginRedirectionEnabled: fixtures.originSingleType.is_origin_redirection_enabled,
      hostHeader: fixtures.originSingleType.host_header,
      method: fixtures.originSingleType.method,
      originPath: fixtures.originSingleType.origin_path,
      connectionTimeout: fixtures.originSingleType.connection_timeout,
      timeoutBetweenBytes: fixtures.originSingleType.timeout_between_bytes,
      hmacAuthentication: fixtures.originSingleType.hmac_authentication,
      hmacRegionName: fixtures.originSingleType.hmac_region_name,
      hmacAccessKey: fixtures.originSingleType.hmac_access_key,
      hmacSecretKey: fixtures.originSingleType.hmac_secret_key
    })

    expect(loadBalancerType).toEqual({
      id: fixtures.originLoadBalancerType.origin_key,
      originKey: {
        content: fixtures.originLoadBalancerType.origin_key
      },
      originId: fixtures.originLoadBalancerType.origin_id,
      name: fixtures.originLoadBalancerType.name,
      originType: 'Load Balancer',
      addresses: ['httpbin.org'],
      originProtocolPolicy: fixtures.originLoadBalancerType.origin_protocol_policy,
      isOriginRedirectionEnabled: fixtures.originLoadBalancerType.is_origin_redirection_enabled,
      hostHeader: fixtures.originLoadBalancerType.host_header,
      method: fixtures.originLoadBalancerType.method,
      originPath: fixtures.originLoadBalancerType.origin_path,
      connectionTimeout: fixtures.originLoadBalancerType.connection_timeout,
      timeoutBetweenBytes: fixtures.originLoadBalancerType.timeout_between_bytes,
      hmacAuthentication: fixtures.originLoadBalancerType.hmac_authentication,
      hmacRegionName: fixtures.originLoadBalancerType.hmac_region_name,
      hmacAccessKey: fixtures.originLoadBalancerType.hmac_access_key,
      hmacSecretKey: fixtures.originLoadBalancerType.hmac_secret_key
    })

    expect(liveIngestType).toEqual({
      id: fixtures.originLiveIngestType.origin_key,
      originKey: {
        content: fixtures.originLiveIngestType.origin_key
      },
      connectionTimeout: undefined,
      hmacAccessKey: undefined,
      hmacAuthentication: undefined,
      hmacRegionName: undefined,
      hmacSecretKey: undefined,
      hostHeader: 'N/A',
      originId: fixtures.originLiveIngestType.origin_id,
      name: fixtures.originLiveIngestType.name,
      originType: 'Live Ingest',
      addresses: ['br-east-1.azioningest.net']
    })
  })
})
