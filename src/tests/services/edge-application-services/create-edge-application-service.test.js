import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeApplicationService } from '@/services/edge-application-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationMock: {
    name: 'Edge Application',
    deliveryProtocol: 'http',
    http3: false,
    httpPort: { value: { value: 80 } },
    httpsPort: { value: 443 },
    minimumTlsVersion: { value: 'TLS 1.2' },
    originType: { value: 'origin' },
    address: '192.168.0.1',
    originProtocolPolicy: 'http-only',
    hostHeader: 'host',
    browserCacheSettings: 'cache',
    browserCacheSettingsMaximumTtl: 3600,
    cdnCacheSettings: 'cdn-cache',
    cdnCacheSettingsMaximumTtl: 3600,
    active: true
  }
}

const makeSut = () => {
  const sut = createEdgeApplicationService

  return {
    sut
  }
}

describe('EdgeApplicationServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    await sut(fixtures.edgeApplicationMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications`,
      method: 'POST',
      body: {
        name: fixtures.edgeApplicationMock.name,
        delivery_protocol: fixtures.edgeApplicationMock.deliveryProtocol,
        http3: false,
        http_port: fixtures.edgeApplicationMock.httpPort.value.value,
        https_port: fixtures.edgeApplicationMock.httpsPort.value,
        minimum_tls_version: fixtures.edgeApplicationMock.minimumTlsVersion.value,
        origin_type: fixtures.edgeApplicationMock.originType.value,
        address: fixtures.edgeApplicationMock.address,
        origin_protocol_policy: fixtures.edgeApplicationMock.originProtocolPolicy,
        host_header: fixtures.edgeApplicationMock.hostHeader,
        browser_cache_settings: fixtures.edgeApplicationMock.browserCacheSettings,
        browser_cache_settings_maximum_ttl:
          fixtures.edgeApplicationMock.browserCacheSettingsMaximumTtl,
        cdn_cache_settings: fixtures.edgeApplicationMock.cdnCacheSettings,
        cdn_cache_settings_maximum_ttl: fixtures.edgeApplicationMock.cdnCacheSettingsMaximumTtl,
        active: fixtures.edgeApplicationMock.active
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.edgeApplicationMock)

    expect(data.feedback).toBe('Your edge application has been created')
  })

  it.each([
    {
      statusCode: 400,
      errorKey: 'invalid_request',
      apiErrorMock: 'invalid_request'
    },
    {
      statusCode: 409,
      errorKey: 'conflict',
      apiErrorMock: 'conflict'
    }
  ])(
    'Should return an API error for an $statusCode response status',
    async ({ statusCode, errorKey, apiErrorMock }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: {
          [errorKey]: [apiErrorMock]
        }
      })
      const { sut } = makeSut()

      const data = sut(fixtures.edgeApplicationMock)

      expect(data).rejects.toThrow(apiErrorMock)
    }
  )

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

      const response = sut(fixtures.edgeApplicationMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
