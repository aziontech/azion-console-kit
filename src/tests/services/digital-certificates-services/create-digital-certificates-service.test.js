import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import {
  InternalServerError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from '@/services/axios/errors'
import { createDigitalCertificatesService } from '@/services/digital-certificates-services'
import { describe, expect, it, vi } from 'vitest'

const basePayloadMock = {
  digitalCertificateName: 'MyWebsiteCertificate',
  certificateType: 'SSL/TLS',
  certificate:
    '-----BEGIN CERTIFICATE-----\nMIIE... (certificate content) ...\n-----END CERTIFICATE-----',
  privateKey:
    '-----BEGIN PRIVATE KEY-----\nMIIE... (private key content) ...\n-----END PRIVATE KEY-----'
}

const fixture = {
  payloadMock: { ...basePayloadMock },
  payloadMockWithoutPrivateKey: { ...basePayloadMock, privateKey: '' },
  payloadMockWithoutCertificate: { ...basePayloadMock, certificate: '' },
  payloadMockWithoutCertificateAndPrivateKey: {
    ...basePayloadMock,
    certificate: '',
    privateKey: ''
  },
  requestBodyMock: {
    name: 'MyWebsiteCertificate',
    certificate_type: 'SSL/TLS',
    certificate:
      '-----BEGIN CERTIFICATE-----\nMIIE... (certificate content) ...\n-----END CERTIFICATE-----',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIE... (private key content) ...\n-----END PRIVATE KEY-----'
  },
  requestBodyMockWithoutPrivateKey: {
    name: 'MyWebsiteCertificate',
    certificate_type: 'SSL/TLS',
    certificate:
      '-----BEGIN CERTIFICATE-----\nMIIE... (certificate content) ...\n-----END CERTIFICATE-----'
  },
  requestBodyMockWithoutCertificate: {
    name: 'MyWebsiteCertificate',
    certificate_type: 'SSL/TLS',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIE... (private key content) ...\n-----END PRIVATE KEY-----'
  },
  requestBodyMockWithoutCertificateAndPrivateKey: {
    name: 'MyWebsiteCertificate',
    certificate_type: 'SSL/TLS'
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
      urlToEditView: `/digital-certificates/edit/1`,
      domainId: 1
    })
  })

  it('should not send certificate and private key when neither is provided', async () => {
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
    await sut(fixture.payloadMockWithoutCertificateAndPrivateKey)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${version}/digital_certificates`,
      body: fixture.requestBodyMockWithoutCertificateAndPrivateKey
    })
  })

  it('should not send certificate when key is not provided', async () => {
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
    await sut(fixture.payloadMockWithoutCertificate)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${version}/digital_certificates`,
      body: fixture.requestBodyMockWithoutCertificate
    })
  })

  it('should not send private key when key is not provided', async () => {
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
    await sut(fixture.payloadMockWithoutPrivateKey)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${version}/digital_certificates`,
      body: fixture.requestBodyMockWithoutPrivateKey
    })
  })

  it('should parse correctly the feedback message when the error is a string inside an object', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: fixture.nameErrorMock
    })
    const { sut } = makeSut()

    const response = sut(fixture.payloadMock)

    expect(response).rejects.toThrow(fixture.nameErrorMock.detail)
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
