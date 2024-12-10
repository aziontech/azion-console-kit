import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
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
        statusCode,
        body: { data: fixtures.certificateMock }
      })
      const { sut } = makeSut()

      const response = sut({ id: fixtures.certificateMock.id })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
