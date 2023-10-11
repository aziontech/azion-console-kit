import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteCredentialService } from '@/services/credential-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteCredentialService

  return { sut }
}

describe('DeleteCredentialsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const idMock = 123

    const { sut } = makeSut(idMock)
    await sut(idMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `credentials/${idMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const idMock = 123

    const { sut } = makeSut(idMock)
    const feedbackMessage = await sut(idMock)

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
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
      const stubId = '123'
      const { sut } = makeSut()

      const response = sut(stubId)
      console.log(response)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
