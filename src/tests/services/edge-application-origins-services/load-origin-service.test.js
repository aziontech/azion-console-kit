import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadOriginService } from '@/services/edge-application-origins-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: 123,
  originMock: {
    name: 'New Origin',
    origin_type: 'single_origin',
    origin_key: '0000000-00000000-00a0a00s0as0-000000',
    addresses: [
      {
        address: 'httpbin.org',
        weight: 1,
        server_role: 'primary',
        is_active: true
      }
    ],
    origin_protocol_policy: 'http',
    host_header: '${host}',
    origin_path: '/requests',
    hmac_authentication: false,
    hmac_region_name: '',
    hmac_access_key: '',
    hmac_secret_key: '',
    connection_timeout: 60,
    timeout_between_bytes: 35
  },
  addressesMock: [
    {
      address: 'httpbin.org',
      weight: 1,
      isActive: true,
      serverRole: 'primary'
    }
  ]
}

const makeSut = () => {
  const sut = loadOriginService

  return {
    sut
  }
}

describe('EdgeApplicationOriginsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: {} }
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut({ edgeApplicationId: fixtures.edgeApplicationId, id: fixtures.originMock.origin_key })
    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${fixtures.edgeApplicationId}/origins/${fixtures.originMock.origin_key}`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.originMock }
    })

    const { sut } = makeSut()
    const result = await sut({})

    expect(result).toEqual({
      originKey: fixtures.originMock.origin_key,
      name: fixtures.originMock.name,
      originType: fixtures.originMock.origin_type,
      addresses: fixtures.addressesMock,
      originProtocolPolicy: fixtures.originMock.origin_protocol_policy,
      hostHeader: fixtures.originMock.host_header,
      method: fixtures.originMock.method,
      originPath: fixtures.originMock.origin_path,
      connectionTimeout: fixtures.originMock.connection_timeout,
      timeoutBetweenBytes: fixtures.originMock.timeout_between_bytes,
      hmacAuthentication: fixtures.originMock.hmac_authentication,
      hmacRegionName: fixtures.originMock.hmac_region_name,
      hmacAccessKey: fixtures.originMock.hmac_access_key,
      hmacSecretKey: fixtures.originMock.hmac_secret_key
    })
  })

  it('should return an error when the request fails with status 400', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { detail: 'Bad Request' }
    })

    const { sut } = makeSut()

    await expect(sut(123123, 'invalid-id')).rejects.toThrow('Bad Request')
  })
})
