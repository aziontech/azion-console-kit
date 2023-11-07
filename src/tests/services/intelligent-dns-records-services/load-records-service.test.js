import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadRecordsService } from '@/services/intelligent-dns-records-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsRecordMock: {
    record_id: 812783,
    entry: 'entry A',
    record_type: 'record Type AAA',
    answers_list: ['123.123.123.11', '123.123.123.9'],
    ttl: 8000,
    policy: 'weighted',
    weight: 100,
    description: 'record description A'
  }
}

const makeSut = () => {
  const sut = loadRecordsService

  return {
    sut
  }
}

describe('IntelligentDnsRecordsServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: { records: [fixtures.dnsRecordMock] } }
    })
    const dnsRecordMockId = 812783
    const intelligentDNSMockId = 7879123
    const { sut } = makeSut()

    await sut({
      id: dnsRecordMockId,
      intelligentDNSId: intelligentDNSMockId
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `intelligent_dns/${intelligentDNSMockId}/records?id=${dnsRecordMockId}`,
      method: 'GET'
    })
  })

  it('should parsed correctly an dns record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: { records: [fixtures.dnsRecordMock, fixtures.dnsRecordMissingDataMock] } }
    })
    const dnsRecordMockId = 812783
    const intelligentDNSMockId = 7879123
    const { sut } = makeSut()

    const result = await sut({
      id: dnsRecordMockId,
      intelligentDNSId: intelligentDNSMockId
    })

    expect(result).toEqual({
      id: fixtures.dnsRecordMock.record_id,
      name: fixtures.dnsRecordMock.entry,
      recordType: fixtures.dnsRecordMock.record_type,
      value: `${fixtures.dnsRecordMock.answers_list[0]},${fixtures.dnsRecordMock.answers_list.at(
        1
      )}`,
      ttl: fixtures.dnsRecordMock.ttl,
      policy: fixtures.dnsRecordMock.policy,
      weight: fixtures.dnsRecordMock.weight,
      description: fixtures.dnsRecordMock.description
    })
  })
})
