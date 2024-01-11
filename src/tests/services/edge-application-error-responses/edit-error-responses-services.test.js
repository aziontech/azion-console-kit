import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editErrorResponsesService } from '@/services/edge-application-error-responses-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  errorResponsePayload: {
    edgeApplicationId: '123',
    id: '123',
    originId: '12',
    errorResponses: [
      {
        code: '500',
        timeout: 2,
        customStatusCode: '503',
        uri: '/teste/',
      },
    ]
  },
}

const makeSut = () => {
  const sut = editErrorResponsesService

  return {
    sut
  }
}

describe('EdgeApplicationDeviceGroupsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()
    const version = 'v4'

    await sut(fixtures.errorResponsePayload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge/applications/${fixtures.errorResponsePayload.edgeApplicationId}/error_responses/${fixtures.errorResponsePayload.id}`,
      method: 'PATCH',
      body: {
        error_responses: [
          {
            code: fixtures.errorResponsePayload.errorResponses[0].code,
            custom_status_code: fixtures.errorResponsePayload.errorResponses[0].custom_status_code,
            timeout: fixtures.errorResponsePayload.errorResponses[0].timeout,
            uri: fixtures.errorResponsePayload.errorResponses[0].uri
          }
        ],
        origin_id: fixtures.errorResponsePayload.originId,
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.errorResponsePayload)

    expect(feedbackMessage).toBe('Your Error Responses has been edited')
  })

  it('Should return an API array error to an invalid error response', async () => {
    const apiErrorMock = 'name should not be empty'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.errorResponsePayload)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })
  it('Should return an API error to an invalid error response', async () => {
    const apiErrorMock = 'name should not be empty'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: apiErrorMock
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.errorResponsePayload)

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

      const response = sut(fixtures.errorResponsePayload)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
