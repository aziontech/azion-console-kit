import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadIntelligentDNSService } from '@/services/intelligent-dns-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsMock: {
    id: 76789,
    name: 'Az-dns',
    domain: 'example.com',
    is_active: true
  }
}

const makeSut = () => {
  const sut = loadIntelligentDNSService

  return {
    sut
  }
}

describe('IntelligentDnsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const dnsIdMock = 76789
    const { sut } = makeSut()
    const version = 'v3'
    await sut({ id: dnsIdMock })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/intelligent_dns/${dnsIdMock}`,
      method: 'GET'
    })
  })

  it('should parsed correctly the returned intelligent dns record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.dnsMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.dnsMock.id })

    expect(result).toEqual({
      id: fixtures.dnsMock.id,
      name: fixtures.dnsMock.name,
      domain: fixtures.dnsMock.domain,
      isActive: true
    })
  })
})
