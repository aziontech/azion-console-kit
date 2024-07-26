import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editDigitalCertificateService } from '@services/digital-certificates-services'
import { describe, expect, it, vi } from 'vitest'

const fixture = {
  payloadMock: {
    id: '123456789',
    name: 'MySSLCertificate',
    certificate:
      '-----BEGIN CERTIFICATE-----\nMIIE... (certificate content) ...\n-----END CERTIFICATE-----',
    privateKey:
      '-----BEGIN PRIVATE KEY-----\nMIIE... (private key content) ...\n-----END PRIVATE KEY-----'
  },
  nameErrorMock: {
    detail: 'The field name needs to be unique. There is already another certificate with this name in your account.'
  },
  errorMock: {
    error: ['Error Message']
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
      statusCode: 200
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixture.payloadMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/digital_certificates/${fixture.payloadMock.id}`,
      method: 'PATCH',
      body: {
        certificate: fixture.payloadMock.certificate,
        name: fixture.payloadMock.name,
        private_key: fixture.payloadMock.privateKey
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixture.payloadMock)

    expect(feedbackMessage).resolves.toBe('Your digital certificate has been updated!')
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
        body: fixture.errorMock
      })
      const { sut } = makeSut()

      const response = sut(fixture.payloadMock)

      expect(response).rejects.toThrow(expectedError)
    }
  )
})
