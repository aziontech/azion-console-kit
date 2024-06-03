import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadRecordsService } from '@/services/edge-dns-records-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsRecordMock: {
    record_id: 812783,
    entry: 'entry A',
    selectedRecordType: 'record Type AAA',
    answers_list: ['123.123.123.11', '123.123.123.9'],
    ttl: 8000,
    selectedPolicy: 'weighted',
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

describe('EdgeDnsRecordsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: { records: [fixtures.dnsRecordMock] } }
    })
    const dnsRecordMockId = 812783
    const edgeDNSMockId = 7879123
    const { sut } = makeSut()
    const version = 'v3'
    await sut({
      id: dnsRecordMockId,
      edgeDNSId: edgeDNSMockId
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/intelligent_dns/${edgeDNSMockId}/records?page_size=200`,
      method: 'GET'
    })
  })

  it('should parsed correctly an dns record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: { records: [fixtures.dnsRecordMock, fixtures.dnsRecordMissingDataMock] } }
    })
    const dnsRecordMockId = 812783
    const edgeDNSMockId = 7879123
    const { sut } = makeSut()

    const result = await sut({
      id: dnsRecordMockId,
      edgeDNSId: edgeDNSMockId
    })

    expect(result).toEqual({
      id: fixtures.dnsRecordMock.record_id,
      name: fixtures.dnsRecordMock.entry,
      recordType: fixtures.dnsRecordMock.record_type,
      value: `${fixtures.dnsRecordMock.answers_list[0]}\n${fixtures.dnsRecordMock.answers_list.at(
        1
      )}`,
      ttl: fixtures.dnsRecordMock.ttl,
      policy: fixtures.dnsRecordMock.policy,
      weight: fixtures.dnsRecordMock.weight,
      description: fixtures.dnsRecordMock.description
    })
  })
})
