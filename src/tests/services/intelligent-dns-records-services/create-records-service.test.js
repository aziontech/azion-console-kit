import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createRecordsService } from '@/services/intelligent-dns-records-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsRecordMock: {
    intelligentDNSID: 123987902,
    selectedRecordType: { _value: 'dns-record-value' },
    name: 'Az-dns-name',
    value: 'dns-answer-record-value',
    ttl: '8000',
    description: 'dns record description',
    weight: 0.9
  }
}

const makeSut = () => {
  const sut = createRecordsService

  return {
    sut
  }
}

describe('IntelligentDnsRecordsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.dnsRecordMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `intelligent_dns/${fixtures.dnsRecordMock.intelligentDNSID}/records`,
      method: 'POST',
      body: {
        record_type: fixtures.dnsRecordMock.selectedRecordType._value,
        entry: fixtures.dnsRecordMock.name,
        answers_list: [fixtures.dnsRecordMock.value],
        ttl: fixtures.dnsRecordMock.ttl,
        description: fixtures.dnsRecordMock.description,
        weight: fixtures.dnsRecordMock.weight
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.dnsRecordMock)

    expect(feedbackMessage).toBe('Resource successfully created')
  })
})
