import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import {
  InternalServerError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from '@/services/axios/errors'
import { createDigitalCertificatesService } from '@/services/digital-certificates-services'
createDigitalCertificatesService
import { describe, expect, it, vi } from 'vitest'

const fixture = {
  payloadMock: {
    digitalCertificateName: 'MyWebsiteCertificate',
    certificateType: 'SSL/TLS',
    certificate:
      '-----BEGIN CERTIFICATE-----\nMIIE... (certificate content) ...\n-----END CERTIFICATE-----',
    privateKey:
      '-----BEGIN PRIVATE KEY-----\nMIIE... (private key content) ...\n-----END PRIVATE KEY-----'
  },
  requestBodyMock: {
    name: 'MyWebsiteCertificate',
    certificate_type: 'SSL/TLS',
    certificate:
      '-----BEGIN CERTIFICATE-----\nMIIE... (certificate content) ...\n-----END CERTIFICATE-----',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIE... (private key content) ...\n-----END PRIVATE KEY-----'
  },
  errorMock: {
    error: ['Error Message']
  }
}

const makeSut = () => {
  const sut = createDigitalCertificatesService

  return {
    sut
  }
}

describe('DigitalCertificatesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })

    const { sut } = makeSut()
    const version = 'v3'
    const result = await sut(fixture.payloadMock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${version}/digital_certificates`,
      body: fixture.requestBodyMock
    })

    expect(result).toEqual({
      feedback: 'Your digital certificate has been created!',
      urlToEditView: `/digital-certificates/edit/1`
    })
  })

  it.each([
    {
      statusCode: 400,
      expectedError: fixture.errorMock[0]
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
        statusCode,
        body: fixture.errorMock
      })
      const { sut } = makeSut()

      const response = sut(fixture.payloadMock)

      expect(response).rejects.toThrow(expectedError)
    }
  )
})
