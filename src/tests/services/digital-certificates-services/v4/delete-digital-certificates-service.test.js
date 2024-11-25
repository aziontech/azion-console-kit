import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteDigitalCertificatesService } from '@/services/digital-certificates-services/v4'
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
      statusCode: 200
    })
    const idMock = 123321
    const { sut } = makeSut(idMock)
    const version = 'v4'
    await sut(idMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/digital_certificates/certificates/${idMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const idStub = 123
    const { sut } = makeSut(idStub)

    const feedbackMessage = await sut(idStub)

    expect(feedbackMessage).toBe('Digital certificate successfully deleted!')
  })

  it.each([
    {
      statusCode: 400,
      expectedError: `Digital Certificate can't be deleted because it is being used.`
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: {
          detail: `Digital Certificate can't be deleted because it is being used.`
        }
      })
      const { sut } = makeSut()

      const response = sut(10)
      expect(response).rejects.toThrow(expectedError)
    }
  )
})
