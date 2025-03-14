import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDomainsService } from '@/services/domains-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  domainMock: {
    product_version: 'custom',
    id: 1718802691,
    name: 'variable-deploy-azion-20240619134303',
    alternate_domains: ['CName 1', 'CName 2'],
    active: true,
    domains: [
      {
        domain: 'nvk8w1x3sa.map.azionedge.net',
        allow_access: true
      }
    ]
  },
  disabledDomainMock: {
    product_version: '1.0',
    id: 4132123,
    name: 'Edge App Y',
    alternate_domains: ['CName 3', 'CName 4'],
    active: false,
    domains: [
      {
        domain: 'nvk8w1x3sa.map.azionedge.net',
        allow_access: true
      }
    ]
  }
}

const makeSut = () => {
  const sut = listDomainsService

  return {
    sut
  }
}

describe('DomainsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
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
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.domainMock, fixtures.disabledDomainMock] }
    })

    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.domainMock.id,
        name: {
          tagProps: {
            icon: 'pi pi-lock',
            value: 'Locked',
            outlined: true,
            severity: 'warning'
          },
          text: fixtures.domainMock.name
        },
        disableEditClick: true,
        isLocked: true,
        domainName: {
          content: fixtures.domainMock.domains[0].domain
        },
        cnames: fixtures.domainMock.alternate_domains,
        active: {
          content: 'Active',
          severity: 'success'
        },
        activeSort: true
      },
      {
        id: fixtures.disabledDomainMock.id,
        name: {
          tagProps: {},
          text: fixtures.disabledDomainMock.name
        },
        disableEditClick: false,
        isLocked: false,
        domainName: {
          content: fixtures.disabledDomainMock.domains[0].domain
        },
        cnames: fixtures.disabledDomainMock.alternate_domains,
        active: {
          content: 'Inactive',
          severity: 'danger'
        },
        activeSort: false
      }
    ])
  })
})
