import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadDigitalCertificateService } from '@/services/digital-certificates-services'

import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = loadDigitalCertificateService

  return {
    sut
  }
}

describe('DigitalCertificatesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: {} }
    })
    const idMock = '123876'

    const { sut } = makeSut()
    await sut({ id: idMock })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `digital_certificates/${idMock}`,
      method: 'GET'
    })
  })
})
