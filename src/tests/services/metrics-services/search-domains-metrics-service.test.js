import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { searchDomainsMetricsService } from '@/services/metrics-services'
import * as Errors from '@services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  domainMock: {
    id: '1234',
    name: 'Edge App X',
    domain_name: 'domain A',
    cnames: ['CName 1', 'CName 2'],
    is_active: true,
    digital_certificate_id: '862026'
  },
  disabledDomainMock: {
    id: '4132123',
    name: 'Edge App Y',
    domain_name: 'domain B',
    cnames: ['CName 3', 'CName 4'],
    is_active: false,
    digital_certificate_id: '69870'
  }
}

const makeSut = () => {
  const sut = searchDomainsMetricsService

  return {
    sut
  }
}

describe('MetricsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `domains?order_by=name&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned domains', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.domainMock, fixtures.disabledDomainMock] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.domainMock.id,
        name: fixtures.domainMock.name,
        domainName: {
          content: fixtures.domainMock.domain_name
        },
        cnames: 'CName 1,CName 2',
        active: {
          content: 'Active',
          severity: 'success'
        },
        edgeApplicationName: fixtures.domainMock.name,
        digitalCertificateId: fixtures.domainMock.digital_certificate_id
      },
      {
        id: fixtures.disabledDomainMock.id,
        name: fixtures.disabledDomainMock.name,
        domainName: {
          content: fixtures.disabledDomainMock.domain_name
        },
        cnames: 'CName 3,CName 4',
        active: {
          content: 'Inactive',
          severity: 'danger'
        },
        edgeApplicationName: fixtures.disabledDomainMock.name,
        digitalCertificateId: fixtures.disabledDomainMock.digital_certificate_id
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
