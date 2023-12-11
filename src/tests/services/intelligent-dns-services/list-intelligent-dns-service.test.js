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

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.dnsMock.id,
        name: fixtures.dnsMock.name,
        domain: { content: fixtures.dnsMock.domain },
        status: {
          content: 'Active',
          severity: 'success'
        }
      },
      {
        id: fixtures.dnsDisabledMock.id,
        name: fixtures.dnsDisabledMock.name,
        domain: { content: fixtures.dnsDisabledMock.domain },
        status: {
          content: 'Inactive',
          severity: 'danger'
        }
      }
    ])
  })
})
