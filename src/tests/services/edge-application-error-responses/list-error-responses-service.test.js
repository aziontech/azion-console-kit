import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listErrorResponsesService } from '@/services/edge-application-error-responses-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  errorResponseSample: {
    id: '123',
    origin_id: '12',
    error_responses: [
      {
        code: 500,
        timeout: 2,
        uri: '/teste/',
        custom_status_code: '503'
      }
    ]
  }
}

const makeSut = () => {
  const sut = listErrorResponsesService

  return { sut }
}

describe('EdgeApplicationDeviceGroupsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.errorResponseSample]
      }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const version = 'v4'
    await sut({ edgeApplicationId: edgeApplicationId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge/applications/${edgeApplicationId}/error_responses`,
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

    expect(result).toEqual({
      id: fixtures.errorResponseSample.id,
      originId: fixtures.errorResponseSample.origin_id,
      errorResponses: [
        {
          code: fixtures.errorResponseSample.error_responses[0].code.toString(),
          customStatusCode: fixtures.errorResponseSample.error_responses[0].custom_status_code,
          timeout: fixtures.errorResponseSample.error_responses[0].timeout,
          uri: fixtures.errorResponseSample.error_responses[0].uri
        }
      ]
    })
  })
})
