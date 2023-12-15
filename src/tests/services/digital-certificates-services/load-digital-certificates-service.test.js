import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { loadDigitalCertificateService } from '@/services/digital-certificates-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  certificateMock: {
    id: 1,
    name: 'Sample Certificate',
    issuer: 'Sample Issuer',
    subject_name: 'Sample Subject',
    validity: '2023-10-31T00:00:00Z',
    status: 'Active',
    certificate_type: 'Sample Type',
    managed: true,
    csr: 'Sample CSR',
    certificate_content: 'Sample Certificate Content'
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
      body: { results: {} }
    })
    const idMock = '123876'

    const { sut } = makeSut()
    const version = 'v3'
    await sut({ id: idMock })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/digital_certificates/${idMock}`,
      method: 'GET'
    })
  })

  it('should parse correctly the api response', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.certificateMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.certificateMock.id })

    expect(result).toEqual({
      id: fixtures.certificateMock.id,
      name: fixtures.certificateMock.name,
      issuer: fixtures.certificateMock.issuer,
      subjectName: fixtures.certificateMock.subject_name,
      validity: fixtures.certificateMock.validity,
      status: fixtures.certificateMock.status,
      certificateType: fixtures.certificateMock.certificate_type,
      managed: true,
      csr: fixtures.certificateMock.csr,
      certificateContent: fixtures.certificateMock.certificate_content
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
        body: { results: fixtures.certificateMock }
      })
      const { sut } = makeSut()

      const response = sut({ id: 1 })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
