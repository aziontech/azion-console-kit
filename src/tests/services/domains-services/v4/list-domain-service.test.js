import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDomainsService } from '@/services/domains-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  domainMock: {
    id: 1718802691,
    name: 'variable-deploy-azion-20240619134303',
    alternate_domains: ['CName 1', 'CName 2'],
    edge_application: 1718801860,
    active: true,
    domains: [
      {
        domain: 'nvk8w1x3sa.map.azionedge.net',
        allow_access: true
      }
    ]
  },
  disabledDomainMock: {
    id: 4132123,
    name: 'Edge App Y',
    alternate_domains: ['CName 3', 'CName 4'],
    active: false,
    edge_application: 1718801861,
    domains: [
      {
        domain: 'nvk8w1x3sa.map.azionedge.net',
        allow_access: true
      }
    ]
  },
  edgeApplicationsMock: [
    { id: 1718801860, name: 'Edge App X', last_modified: new Date() },
    { id: 1718801861, name: 'Edge App Y', last_modified: new Date() }
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
        body: { results: fixtures.edgeApplicationsMock, count: 1 }
      })

    const { sut } = makeSut()
    const version = 'v4'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/workspace/workloads?ordering=name&page=1&page_size=10&fields=&search=`,
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
          content: fixtures.domainMock.domains[0].domain
        },
        cnames: fixtures.domainMock.alternate_domains,
        active: {
          content: 'Active',
          severity: 'success'
        },
        activeSort: true,
        edgeApplicationName: fixtures.edgeApplicationsMock[0].name
      },
      {
        id: fixtures.disabledDomainMock.id,
        name: fixtures.disabledDomainMock.name,
        domainName: {
          content: fixtures.disabledDomainMock.domains[0].domain
        },
        cnames: fixtures.disabledDomainMock.alternate_domains,
        active: {
          content: 'Inactive',
          severity: 'danger'
        },
        activeSort: false,
        edgeApplicationName: fixtures.edgeApplicationsMock[1].name
      }
    ])
  })
})
