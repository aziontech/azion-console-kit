import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listIntelligentDNSService } from '@/services/intelligent-dns-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsMock: {
    id: 1987867,
    name: 'Az-dns',
    domain: 'example.com',
    is_active: true
  },
  dnsDisabledMock: {
    id: 98678,
    name: 'Az-dns 2',
    domain: 'some-domain-example.com',
    is_active: false
  }
}

const makeSut = () => {
  const sut = listIntelligentDNSService

  return {
    sut
  }
}

describe('IntelligentDnsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: null }
    })

    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `intelligent_dns?order_by=name&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parsed correctly each dns record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.dnsMock, fixtures.dnsDisabledMock] }
    })
    const { sut } = makeSut()

    const domains = await sut({})

    expect(domains).toEqual([
      {
        id: fixtures.dnsMock.id,
        name: fixtures.dnsMock.name,
        domain: fixtures.dnsMock.domain,
        isActive: 'Yes'
      },
      {
        id: fixtures.dnsDisabledMock.id,
        name: fixtures.dnsDisabledMock.name,
        domain: fixtures.dnsDisabledMock.domain,
        isActive: 'No'
      }
    ])
  })
})
