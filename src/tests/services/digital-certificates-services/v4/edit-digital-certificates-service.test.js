import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editDigitalCertificateService } from '@services/digital-certificates-services/v4'
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
  payloadMockOnlyName: {
    id: '123456789',
    name: 'MySSLCertificate',
    certificate: '',
    privateKey: ''
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
    const version = 'v4'
    await sut(fixture.payloadMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/digital_certificates/certificates/${fixture.payloadMock.id}`,
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

  it('should return a feedback message on successfully updated send only name', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixture.payloadMockOnlyName)

    expect(feedbackMessage).resolves.toBe('Your digital certificate has been updated!')
  })

  it('should parse correctly the feedback message when the error is a string inside an object', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixture.payloadMock)

    expect(apiErrorResponse).rejects.toBe(apiErrorMock.detail)
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixture.payloadMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
