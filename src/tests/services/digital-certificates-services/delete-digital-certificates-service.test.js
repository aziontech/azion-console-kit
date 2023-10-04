import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
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

    await sut(idMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `digital_certificates/${idMock}`,
      method: 'DELETE'
    })
  })
})
