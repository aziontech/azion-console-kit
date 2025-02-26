import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeDNSService } from '@/services/edge-dns-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsMock: {
    id: 1987867,
    name: 'Az-dns',
    domain: 'example.com',
    active: true
  },
  dnsDisabledMock: {
    id: 98678,
    name: 'Az-dns 2',
    domain: 'some-domain-example.com',
    active: false
  }
}

const makeSut = () => {
  const sut = listEdgeDNSService

  return {
    sut
  }
}

describe('EdgeDnsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: null }
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_dns/zones?ordering=&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parsed correctly each dns record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.dnsMock, fixtures.dnsDisabledMock], count: 2 }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result.body).toEqual([
      {
        active: {
          content: 'Active',
          severity: 'success'
        },
        id: fixtures.dnsMock.id,
        name: fixtures.dnsMock.name,
        domain: { content: fixtures.dnsMock.domain }
      },
      {
        id: fixtures.dnsDisabledMock.id,
        name: fixtures.dnsDisabledMock.name,
        domain: { content: fixtures.dnsDisabledMock.domain },
        active: {
          content: 'Inactive',
          severity: 'danger'
        }
      }
    ])
  })
})
