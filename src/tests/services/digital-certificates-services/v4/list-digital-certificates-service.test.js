import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { listDigitalCertificatesService } from '@/services/digital-certificates-services/v4'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  certificateMock: {
    id: 1,
    name: 'Certificate 1',
    issuer: 'Issuer 1',
    subject_name: ['Subject 1', 'Subject 2'],
    type: 'edge_certificate',
    validity: new Date(2023, 10, 10),
    status: 'active'
  },
  trustedCertificateMock: {
    id: 3,
    name: 'Certificate 3',
    issuer: 'Issuer 3',
    subject_name: ['Subject 1', 'Subject 2'],
    type: 'trusted_ca_certificate',
    validity: new Date(2023, 10, 10),
    status: 'active'
  },
  certificateWithMissingData: {
    id: 2,
    name: 'Certificate 2',
    subject_name: null,
    type: null,
    validity: null,
    status: 'pending'
  }
}

const makeSut = () => {
  const sut = listDigitalCertificatesService

  return {
    sut
  }
}

describe('DigitalCertificatesServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: []
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/digital_certificates/certificates?ordering=name&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [
          fixtures.certificateMock,
          fixtures.certificateWithMissingData,
          fixtures.trustedCertificateMock
        ]
      }
    })
    const { sut } = makeSut()

    const result = await sut({})
    const [parsedDomain, parsedDomainMissingValues] = result

    expect(parsedDomain).toEqual({
      id: fixtures.certificateMock.id,
      name: fixtures.certificateMock.name,
      issuer: fixtures.certificateMock.issuer,
      type: 'TLS Certificate',
      subjectName: 'Subject 1,Subject 2',
      validity: 'Nov 10, 2023, 12:00 AM',
      status: {
        content: 'Active',
        severity: 'success'
      }
    })
    expect(parsedDomainMissingValues).toEqual({
      id: 2,
      issuer: '-',
      name: 'Certificate 2',
      status: {
        content: 'Pending',
        severity: 'danger'
      },
      subjectName: '-',
      type: '-',
      validity: '-'
    })
    it('should parse correctly each returned item', async () => {
      localeMock()
      vi.setSystemTime(new Date(2023, 10, 10, 10))
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: {
          results: [
            fixtures.certificateMock,
            fixtures.certificateWithMissingData,
            fixtures.trustedCertificateMock
          ]
        }
      })
      const { sut } = makeSut()

      const result = await sut({})
      const [parsedDomain, parsedDomainMissingValues, trustedCertificate] = result

      expect(parsedDomain).toEqual({
        id: fixtures.certificateMock.id,
        name: fixtures.certificateMock.name,
        issuer: fixtures.certificateMock.issuer,
        type: 'TLS Certificate',
        subjectName: 'Subject 1,Subject 2',
        validity: 'Nov 10, 2023, 12:00 AM',
        status: {
          content: 'Active',
          severity: 'success'
        }
      })
      expect(parsedDomainMissingValues).toEqual({
        id: 2,
        issuer: '-',
        name: 'Certificate 2',
        status: {
          content: 'Inactive',
          severity: 'danger'
        },
        subjectName: '-',
        type: '-',
        validity: '-'
      })
      expect(trustedCertificate).toEqual({
        id: fixtures.trustedCertificate.id,
        name: fixtures.trustedCertificate.name,
        issuer: fixtures.trustedCertificate.issuer,
        type: 'Trusted CA Certificate',
        subjectName: 'Subject 1,Subject 2',
        validity: 'Nov 10, 2023, 12:00 AM',
        status: {
          content: 'Active',
          severity: 'success'
        }
      })
    })
  })

  it('should return correct certificates when search parameters are provided', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.certificateMock]
      }
    })
    const { sut } = makeSut()
    const result = await sut({ search: 'Certificate1' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/digital_certificates/certificates?ordering=name&page=1&page_size=10&fields=&search=Certificate1`,
      method: 'GET'
    })
    expect(result).toEqual([
      {
        id: fixtures.certificateMock.id,
        name: fixtures.certificateMock.name,
        issuer: fixtures.certificateMock.issuer,
        type: 'TLS Certificate',
        subjectName: 'Subject 1,Subject 2',
        validity: 'Nov 10, 2023, 12:00 AM',
        status: {
          content: 'Active',
          severity: 'success'
        }
      }
    ])
  })

  it('should return correct certificates when ordering parameters are provided', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.certificateMock]
      }
    })
    const { sut } = makeSut()
    const result = await sut({ ordering: 'issuer' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/digital_certificates/certificates?ordering=issuer&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
    expect(result).toEqual([
      {
        id: fixtures.certificateMock.id,
        name: fixtures.certificateMock.name,
        issuer: fixtures.certificateMock.issuer,
        type: 'TLS Certificate',
        subjectName: 'Subject 1,Subject 2',
        validity: 'Nov 10, 2023, 12:00 AM',
        status: {
          content: 'Active',
          severity: 'success'
        }
      }
    ])
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
        body: { results: [] }
      })
      const { sut } = makeSut()

      const response = sut({})

      expect(response).rejects.toBe(expectedError)
    }
  )
})
