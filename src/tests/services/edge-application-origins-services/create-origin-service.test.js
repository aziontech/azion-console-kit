import { createOriginService } from '@/services/edge-application-origins-services'
import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const fixtures = {
  edgeApplicationId: 123,
  originMock: {
    name: 'New Origin',
    origin_type: 'single_origin',
    method: '',
    addresses: [
      {
        address: 'httpbin.org'
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
  }
}

const makeSut = () => {
  const sut = createOriginService

  return { sut }
}

describe('EdgeApplicationOriginsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })

    const { sut } = makeSut()

    await sut(fixtures.originMock, fixtures.edgeApplicationId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_applications/${fixtures.edgeApplicationId}/origins`,
      method: 'POST',
      body: {
        name: fixtures.originMock.name,
        host_header: fixtures.originMock.hostHeader,
        method: fixtures.originMock.method,
        addresses: fixtures.originMock.addresses,
        origin_path: fixtures.originMock.originPath,
        origin_protocol_policy: fixtures.originMock.originProtocolPolicy,
        hmac_authentication: fixtures.originMock.hmacAuthentication,
        hmac_region_name: fixtures.originMock.hmacRegionName,
        hmac_access_key: fixtures.originMock.hmacAccessKey,
        hmac_secret_key: fixtures.originMock.hmacSecretKey,
        connection_timeout: fixtures.originMock.connectionTimeout,
        timeout_between_bytes: fixtures.originMock.timeoutBetweenBytes
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.originMock, fixtures.edgeApplicationId)

    expect(feedbackMessage).toBe('Resource successfully created')
  })
})
