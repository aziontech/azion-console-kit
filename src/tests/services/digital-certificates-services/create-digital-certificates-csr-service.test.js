import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import {
  InternalServerError,
  InvalidApiRequestError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from '@/services/axios/errors'
import { createDigitalCertificatesCSRService } from '@/services/digital-certificates-services'
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
    sans: ['SAN1', 'SAN2', 'SAN3']
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
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut(fixture.csrCertificateMock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'digital_certificates/csr',
      body: fixture.requestBodyMock
    })
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new InvalidApiRequestError().message
    },
    {
      statusCode: 401,
      expectedError: new InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new UnexpectedError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixture.csrCertificateMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
