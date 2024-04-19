import { createOriginService } from '@/services/edge-application-origins-services'
import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  originMock: {
    id: 123,
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
      statusCode: 201,
      body: {
        results: {
          origin_key: 1
        }
      }
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.originMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${fixtures.originMock.id}/origins`,
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

  it('Should return an API error to an invalid edge application ', async () => {
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

  it('Should return an API error with object to an invalid edge application', async () => {
    const apiErrorMock = 'name should not be empty'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: {
        addresses: [{ address: [apiErrorMock] }]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.originMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          origin_key: 'test-origin-key'
        }
      }
    })
    const { sut } = makeSut()

    const { feedback, originKey } = await sut(fixtures.originMock, fixtures.edgeApplicationId)

    expect(originKey).toBe('test-origin-key')
    expect(feedback).toBe('Your origin has been created')
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
