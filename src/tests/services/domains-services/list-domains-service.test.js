import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDomainsService } from '@/services/domains-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  domainMock: {
    id: '1234',
    name: 'Edge App X',
    domain_name: 'domain A',
    cnames: ['CName 1', 'CName 2'],
    is_active: true,
    activeSort: true,
    digital_certificate_id: '862026',
    edge_application_id: 'ea1234'
  },
  disabledDomainMock: {
    id: '4132123',
    name: 'Edge App Y',
    domain_name: 'domain B',
    cnames: ['CName 3', 'CName 4'],
    is_active: false,
    activeSort: false,
    digital_certificate_id: null,
    edge_application_id: 'ea5678'
  },
  edgeApplicationsMock: [
    { id: 'ea1234', name: 'Edge App X', last_modified: new Date() },
    { id: 'ea5678', name: 'Edge App Y', last_modified: new Date() }
  ]
}

const makeSut = () => {
  const sut = listDomainsService

  return {
    sut
  }
}

describe('DomainsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi
      .spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { results: [] }
      })
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { results: fixtures.edgeApplicationsMock }
      })

    const { sut } = makeSut()
    const version = 'v3'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/domains?order_by=name&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned domains', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { results: [fixtures.domainMock, fixtures.disabledDomainMock] }
      })
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { results: fixtures.edgeApplicationsMock }
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
        cnames: fixtures.domainMock.cnames,
        active: {
          content: 'Active',
          severity: 'success'
        },
        activeSort: true,
        edgeApplicationName: fixtures.edgeApplicationsMock[0].name,
        digitalCertificateId: fixtures.domainMock.digital_certificate_id
      },
      {
        id: fixtures.disabledDomainMock.id,
        name: fixtures.disabledDomainMock.name,
        domainName: {
          content: fixtures.disabledDomainMock.domain_name
        },
        cnames: fixtures.disabledDomainMock.cnames,
        active: {
          content: 'Inactive',
          severity: 'danger'
        },
        activeSort: false,
        edgeApplicationName: fixtures.edgeApplicationsMock[1].name,
        digitalCertificateId: 'Azion (SAN)'
      }
    ])
  })
})
