import { createOriginService } from '@/services/edge-application-origins-services'
import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  requestPayloadMock: {
    id: 123,
    name: 'New Origin',
    originType: 'single_origin',
    method: '',
    addresses: [
      {
        address: 'httpbin.org',
        serverRole: 'primary',
        isActive: true
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
  },
  adaptedPayloadMock: {
    name: 'New Origin',
    origin_type: 'single_origin',
    method: '',
    addresses: [
      {
        address: 'httpbin.org',
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
  }
}

const scenarios = [
  {
    label: 'should call API with correct params when origin type is single origin',
    payload: fixtures.requestPayloadMock,
    adaptedPayload: fixtures.adaptedPayloadMock
  },
  {
    label: 'should call API with correct params when origin type is load balancer',
    payload: {
      ...fixtures.requestPayloadMock,
      originType: 'load_balancer',
      addresses: [
        {
          ...fixtures.requestPayloadMock.addresses[0],
          weight: 1
        }
      ]
    },
    adaptedPayload: {
      ...fixtures.adaptedPayloadMock,
      origin_type: 'load_balancer',
      addresses: [
        {
          ...fixtures.adaptedPayloadMock.addresses[0],
          weight: 1
        }
      ]
    }
  },
  {
    label: 'should call API with correct params when origin type is object storage',
    payload: {
      ...fixtures.requestPayloadMock,
      originType: 'object_storage',
      bucketName: 'my-bucket',
      prefix: '/test'
    },
    adaptedPayload: {
      name: 'New Origin',
      origin_type: 'object_storage',
      bucket: 'my-bucket',
      prefix: '/test'
    }
  }
]

const makeSut = () => {
  const sut = createOriginService

  return { sut }
}

describe('EdgeApplicationOriginsServices', () => {
  it.each(scenarios)('$label', async ({ payload, adaptedPayload }) => {
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
    await sut(payload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${payload.id}/origins`,
      method: 'POST',
      body: adaptedPayload
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

    const feedbackMessage = sut(fixtures.adaptedPayloadMock)

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

    const feedbackMessage = sut(fixtures.adaptedPayloadMock)

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

    const feedbackMessage = sut(fixtures.adaptedPayloadMock)

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

    const { feedback, originKey } = await sut(
      fixtures.adaptedPayloadMock,
      fixtures.edgeApplicationId
    )

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

      const response = sut(fixtures.adaptedPayloadMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
