import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deletePersonalToken } from '@/services/personal-tokens-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const makeSut = () => {
  const sut = deletePersonalToken

  return {
    sut
  }
}

describe('PersonalTokensServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const { sut } = makeSut()
    const personalTokenIdMock = 987678
    const version = 'v4'
    await sut(personalTokenIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/personal_tokens/${personalTokenIdMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const personalTokenIdMock = 987678
    const { sut } = makeSut()

    const feedbackMessage = await sut(personalTokenIdMock)

    expect(feedbackMessage).toBe('Personal token successfully deleted')
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.NotFoundError().message
    },
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut()

      expect(response).rejects.toBe(expectedError)
    }
  )
})
