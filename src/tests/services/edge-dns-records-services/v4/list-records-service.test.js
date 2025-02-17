import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listRecordsService } from '@/services/edge-dns-records-services/v4/list-records-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  zoneId: 1234567890,
  dnsRecordMock: {
    id: '123',
    entry: 'test.domain.com',
    record_type: 'A',
    answers_list: ['192.168.1.1'],
    ttl: 3600,
    policy: 'simple',
    weight: 10,
    description: 'Test DNS record'
  }
}

const makeSut = () => {
  const sut = listRecordsService
  return { sut }
}

describe('EdgeDNSRecordsServicesV4', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [],
        count: 0
      }
    })

    const { sut } = makeSut()
    await sut({
      id: fixtures.zoneId
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_dns/zones/${fixtures.zoneId}/records?ordering=entry&page=1&page_size=10&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parse each dns record correctly', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.dnsRecordMock],
        count: 1
      }
    })

    const { sut } = makeSut()
    const result = await sut({
      id: fixtures.zoneId
    })

    expect(result).toEqual({
      count: 1,
      body: [
        {
          id: fixtures.dnsRecordMock.id,
          name: fixtures.dnsRecordMock.entry,
          type: fixtures.dnsRecordMock.record_type,
          value: fixtures.dnsRecordMock.answers_list,
          ttl: fixtures.dnsRecordMock.ttl,
          policy: fixtures.dnsRecordMock.policy,
          weight: fixtures.dnsRecordMock.weight,
          description: fixtures.dnsRecordMock.description
        }
      ]
    })
  })

  it('should return empty array when no results', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [],
        count: 0
      }
    })

    const { sut } = makeSut()
    const result = await sut({
      id: fixtures.zoneId
    })

    expect(result).toEqual([])
  })
})
