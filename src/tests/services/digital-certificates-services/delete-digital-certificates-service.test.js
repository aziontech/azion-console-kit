import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteDigitalCertificatesService } from '@/services/digital-certificates-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteDigitalCertificatesService

  return {
    sut
  }
}

describe('DigitalCertificatesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const idMock = 123321
    const { sut } = makeSut(idMock)
    const version = 'v3'
    await sut(idMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/digital_certificates/${idMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const idStub = 123
    const { sut } = makeSut(idStub)

    const feedbackMessage = await sut(idStub)

    expect(feedbackMessage).toBe('Digital certificate successfully deleted!')
  })

  it.each([
    {
      statusCode: 400,
      expectedError: 'Resource not found.'
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

      expect(response).rejects.toBe(expectedError)
    }
  )

  it('should throw when try to delete a digital certificate that is being used', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 409,
      body: {
        detail: `Digital Certificate can't be deleted because it is being used.`
      }
    })
    const stubId = '123'
    const { sut } = makeSut()

    const response = sut(stubId)

    expect(response).rejects.toBe(
      `Digital Certificate can't be deleted because it is being used.`
    )
  })
})
