import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { InternalServerError } from '@/services/axios/errors'
import { createDigitalCertificatesCSRService } from '@/services/digital-certificates-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixture = {
  csrCertificateMock: {
    digitalCertificateName: 'YourDigitalCertificateName',
    common: 'CommonName',
    city: 'City',
    state: 'State',
    country: 'Country',
    organization: 'Organization',
    email: 'email@example.com',
    organizationUnity: 'OrganizationUnity',
    subjectAlternativeNames: 'SAN1\nSAN2\nSAN3'
  },
  requestBodyMock: {
    name: 'YourDigitalCertificateName',
    common_name: 'CommonName',
    locality: 'City',
    state: 'State',
    country: 'Country',
    organization: 'Organization',
    email: 'email@example.com',
    organization_unity: 'OrganizationUnity',
    private_key_type: 'rsa_2048',
    alternative_names: ['SAN1', 'SAN2', 'SAN3']
  },
  nameErrorMock: {
    detail:
      'The field name needs to be unique. There is already another certificate with this name in your account.'
  },
  errorMock: {
    error: ['Error Message']
  }
}

const makeSut = () => {
  const sut = createDigitalCertificatesCSRService

  return {
    sut
  }
}

describe('DigitalCertificatesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: 1
        }
      }
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixture.csrCertificateMock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${version}/digital_certificates/csr`,
      body: fixture.requestBodyMock
    })
  })

  it('should parse correctly the feedback message when the error is a string inside an object', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: fixture.nameErrorMock
    })
    const { sut } = makeSut()

    const response = sut(fixture.csrCertificateMock)

    expect(response).rejects.toThrow(fixture.nameErrorMock.detail)
  })

  it.each([
    {
      statusCode: 400,
      expectedError: fixture.errorMock[0]
    },
    {
      statusCode: 500,
      expectedError: new InternalServerError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: fixture.errorMock
      })
      const { sut } = makeSut()

      const response = sut(fixture.csrCertificateMock)
      expect(response).rejects.toThrow(expectedError)
    }
  )
})
