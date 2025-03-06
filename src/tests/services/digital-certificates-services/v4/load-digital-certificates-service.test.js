import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadDigitalCertificateService } from '@/services/digital-certificates-services/v4/'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  certificateMock: {
    id: 72395,
    name: 'Cert_A.pem',
    type: 'trusted_ca_certificate',
    managed: false,
    csr: null
  }
}

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
      body: { data: fixtures.certificateMock }
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut({ id: fixtures.certificateMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/digital_certificates/certificates/${fixtures.certificateMock.id}?fields=id,name,type,csr,managed`,
      method: 'GET'
    })
  })

  it('should parse correctly the api response', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.certificateMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.certificateMock.id })

    expect(result).toEqual({
      id: fixtures.certificateMock.id,
      name: fixtures.certificateMock.name,
      type: fixtures.certificateMock.type,
      managed: fixtures.certificateMock.managed,
      csr: undefined
    })
  })

  it('should throw an error when request fails', async () => {
    const errorMock = new Error('Request failed')
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(errorMock)

    const { sut } = makeSut()
    const promise = sut({ id: fixtures.certificateMock.id })

    await expect(promise).rejects.toThrow('Request failed')
  })
})
