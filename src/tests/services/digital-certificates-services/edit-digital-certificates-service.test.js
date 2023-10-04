import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editDigitalCertificateService } from '@services/digital-certificates-services'
import { describe, expect, it, vi } from 'vitest'

const fixture = {
  payloadMock: {
    id: '9384726',
    name: 'NAME',
    certificate: 'CERTF',
    privateKey: 'PRIVATE_KEY_!233'
  }
}

const makeSut = () => {
  const sut = editDigitalCertificateService

  return {
    sut
  }
}

describe('DigitalCertificatesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    await sut(fixture.payloadMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `digital_certificates/${fixture.payloadMock.id}`,
      method: 'PATCH',
      body: {
        certificate: fixture.payloadMock.certificate,
        name: fixture.payloadMock.name,
        private_key: fixture.payloadMock.privateKey
      }
    })
  })
})
