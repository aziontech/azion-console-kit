import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadRecordsService } from '@/services/edge-dns-records-services/v4/load-record-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeDNSId: 123456,
  recordMock: {
    data: {
      id: 789,
      entry: 'test.domain.com',
      record_type: 'A',
      answers_list: ['192.168.0.1', '192.168.0.2'],
      ttl: 3600,
      policy: 'simple',
      weight: 10,
      description: 'Test record'
    }
  }
}

const makeSut = () => {
  const sut = loadRecordsService
  return { sut }
}

describe('EdgeDNSRecordsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.recordMock
    })

    const { sut } = makeSut()
    await sut({
      edgeDNSId: fixtures.edgeDNSId,
      id: fixtures.recordMock.data.id
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_dns/zones/${fixtures.edgeDNSId}/records/${fixtures.recordMock.data.id}`,
      method: 'GET'
    })
  })

  it('should correctly parse the record data', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.recordMock
    })

    const { sut } = makeSut()
    const result = await sut({
      edgeDNSId: fixtures.edgeDNSId,
      id: fixtures.recordMock.data.id
    })

    expect(result).toEqual({
      id: fixtures.recordMock.data.id,
      name: fixtures.recordMock.data.entry,
      selectedRecordType: fixtures.recordMock.data.record_type,
      value: fixtures.recordMock.data.answers_list.join('\n'),
      ttl: fixtures.recordMock.data.ttl,
      selectedPolicy: fixtures.recordMock.data.policy,
      weight: fixtures.recordMock.data.weight,
      description: fixtures.recordMock.data.description
    })
  })

  it('should correctly join multiple answers into a single string', async () => {
    const mockWithMultipleAnswers = {
      ...fixtures.recordMock,
      data: {
        ...fixtures.recordMock.data,
        answers_list: ['192.168.0.1', '192.168.0.2', '192.168.0.3']
      }
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: mockWithMultipleAnswers
    })

    const { sut } = makeSut()
    const result = await sut({
      edgeDNSId: fixtures.edgeDNSId,
      id: fixtures.recordMock.data.id
    })

    expect(result.value).toBe('192.168.0.1\n192.168.0.2\n192.168.0.3')
  })
})
