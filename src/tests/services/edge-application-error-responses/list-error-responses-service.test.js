import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listErrorResponsesService } from '@/services/edge-application-error-responses-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  errorResponseSample: {
    id: 123,
    origin_id: '12',
    error_responses: [
      {
        code: 'any',
        timeout: 2,
        uri: '/teste/',
        custom_status_code: '503'
      }
    ]
  },
  parsedCode: 'any',
  parsedCustomCode: 503
}

const makeSut = () => {
  const sut = listErrorResponsesService

  return { sut }
}

describe('EdgeApplicationErrorResponsesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.errorResponseSample]
      }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    await sut({ edgeApplicationId: edgeApplicationId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${edgeApplicationId}/error_responses`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.errorResponseSample]
      }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const result = await sut({ edgeApplicationId: edgeApplicationId })
    const [errorResponse] = fixtures.errorResponseSample.error_responses
    expect(result).toEqual({
      id: fixtures.errorResponseSample.id,
      originId: fixtures.errorResponseSample.origin_id.toString(),
      errorResponses: [
        {
          code: fixtures.parsedCode,
          customStatusCode: fixtures.parsedCustomCode,
          timeout: errorResponse.timeout,
          uri: errorResponse.uri
        }
      ]
    })
  })
})
