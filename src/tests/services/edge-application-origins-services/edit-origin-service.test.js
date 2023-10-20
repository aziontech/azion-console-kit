import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editOriginService } from '@/services/edge-application-origins-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: 123,
  originMock: {
    name: 'New Origin',
    originType: 'single_origin',
    originKey: '0000000-00000000-00a0a00s0as0-000000',
    addresses: [
      {
        address: 'httpbin.org',
        weight: 1
      }
    ],
    originProtocolPolicy: 'http',
    hostHeader: '${host}',
    originPath: '/requests',
    hmacAuthentication: false,
    hmacRegionName: '',
    hmacAccessKey: '',
    hmacSecretKey: '',
    connectionTimeout: 60,
    timeoutBetweenBytes: 35
  }
}

const makeSut = () => {
  const sut = editOriginService

  return {
    sut
  }
}

describe('EdgeApplicationOriginsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })

    const { sut } = makeSut()

    await sut(fixtures.originMock, fixtures.edgeApplicationId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_applications/${fixtures.edgeApplicationId}/origins/${fixtures.originMock.originKey}`,
      method: 'PATCH',
      body: {
        name: fixtures.originMock.name,
        host_header: fixtures.originMock.hostHeader,
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

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.originMock, fixtures.edgeApplicationId)

    expect(feedbackMessage).toBe('Resource successfully updated')
  })
})
