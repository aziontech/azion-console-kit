import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editOriginService } from '@/services/edge-application-origins-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  originMock: {
    id: '0000000-00000000-00a0a00s0as0-000000',
    edgeApplicationId: 123,
    name: 'New Origin',
    originType: 'single_origin',
    originKey: '0000000-00000000-00a0a00s0as0-000000',
    addresses: [
      {
        address: 'httpbin.org',
        weight: 1,
        isActive: true,
        serverRole: 'primary'
      }
    ],
    method: 'GET',
    isOriginRedirectionEnabled: false,
    originProtocolPolicy: 'http',
    hostHeader: '${host}',
    originPath: '/requests',
    hmacAuthentication: false,
    hmacRegionName: '',
    hmacAccessKey: '',
    hmacSecretKey: '',
    connectionTimeout: 60,
    timeoutBetweenBytes: 35
  },
  originTypeObjectStorage: {
    id: '0000000-00000000-00a0a00s0as0-000000',
    edgeApplicationId: 123,
    name: 'New Origin',
    originProtocolPolicy: 'http',
    originType: 'object_storage',
    bucketName: 'my-bucket',
    prefix: '/test'
  },
  requestPayloadMockLiveIngest: {
    id: '0000000-00000000-00a0a00s0as0-000000',
    edgeApplicationId: 123,
    name: 'New Origin',
    originType: 'live_ingest',
    streamingEndpoint: 'br-east-1.azioningest.net'
  },
  emptyPrefixOrigin: {
    id: '0000000-00000000-00a0a00s0as0-000000',
    edgeApplicationId: 123,
    name: 'New Origin',
    originProtocolPolicy: 'http',
    originType: 'object_storage',
    bucketName: 'my-bucket',
    prefix: ''
  },
  addressesMock: [
    {
      address: 'httpbin.org',
      weight: 1,
      is_active: true,
      server_role: 'primary'
    }
  ]
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
      statusCode: 200
    })

    const { sut } = makeSut()
    const version = 'v3'

    await sut(fixtures.originMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${fixtures.originMock.edgeApplicationId}/origins/${fixtures.originMock.id}`,
      method: 'PATCH',
      body: {
        origin_type: fixtures.originMock.originType,
        is_origin_redirection_enabled: fixtures.originMock.isOriginRedirectionEnabled,
        method: fixtures.originMock.method,
        name: fixtures.originMock.name,
        host_header: fixtures.originMock.hostHeader,
        addresses: fixtures.addressesMock,
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

  it('should call API with correct params when origin type is object storage', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    const version = 'v3'

    await sut(fixtures.originTypeObjectStorage)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${fixtures.originTypeObjectStorage.edgeApplicationId}/origins/${fixtures.originTypeObjectStorage.id}`,
      method: 'PATCH',
      body: {
        origin_type: fixtures.originTypeObjectStorage.originType,
        name: fixtures.originTypeObjectStorage.name,
        bucket: fixtures.originTypeObjectStorage.bucketName,
        prefix: fixtures.originTypeObjectStorage.prefix
      }
    })
  })

  it('should call API with correct params when origin type is live ingest', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    const version = 'v3'

    await sut(fixtures.requestPayloadMockLiveIngest)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${fixtures.requestPayloadMockLiveIngest.edgeApplicationId}/origins/${fixtures.requestPayloadMockLiveIngest.id}`,
      method: 'PATCH',
      body: {
        origin_type: fixtures.requestPayloadMockLiveIngest.originType,
        name: fixtures.requestPayloadMockLiveIngest.name,
        streaming_endpoint: fixtures.requestPayloadMockLiveIngest.streamingEndpoint
      }
    })
  })

  it('should adapt prefix to / when the field is empty', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    const version = 'v3'

    await sut(fixtures.emptyPrefixOrigin)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${fixtures.emptyPrefixOrigin.edgeApplicationId}/origins/${fixtures.emptyPrefixOrigin.id}`,
      method: 'PATCH',
      body: {
        origin_type: fixtures.emptyPrefixOrigin.originType,
        name: fixtures.emptyPrefixOrigin.name,
        bucket: fixtures.emptyPrefixOrigin.bucketName,
        prefix: '/'
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.originMock, fixtures.edgeApplicationId)

    expect(feedbackMessage).toBe('Your Origin has been edited')
  })

  it('Should return an API array error to an invalid edge application', async () => {
    const apiErrorMock = 'name should not be empty'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.originMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })
  it('Should return an API error to an invalid edge application', async () => {
    const apiErrorMock = 'name should not be empty'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: apiErrorMock
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.originMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.originMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
