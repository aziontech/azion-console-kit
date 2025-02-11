import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editRecordsService } from '@/services/edge-dns-records-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  recordMock: {
    edgeDNSId: 123456,
    id: 789012,
    selectedRecordType: 'A',
    name: 'test.domain.com',
    value: '192.168.1.1\n192.168.1.2',
    ttl: 3600,
    selectedPolicy: 'simple-round-robin',
    weight: 10,
    description: 'Test record description'
  }
}

const makeSut = () => {
  const sut = editRecordsService

  return { sut }
}

describe('EdgeDNSRecordsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.recordMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_dns/zones/${fixtures.recordMock.edgeDNSId}/records/${fixtures.recordMock.id}`,
      method: 'PUT',
      body: {
        record_type: fixtures.recordMock.selectedRecordType,
        entry: fixtures.recordMock.name,
        answers_list: ['192.168.1.1', '192.168.1.2'],
        ttl: fixtures.recordMock.ttl,
        policy: fixtures.recordMock.selectedPolicy,
        weight: fixtures.recordMock.weight,
        description: fixtures.recordMock.description
      }
    })
  })

  it('should return success message when record is updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.recordMock)

    expect(result).toBe('Edge DNS Record has been updated')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: { detail: 'Internal server error' }
    })
    const { sut } = makeSut()

    const promise = sut(fixtures.recordMock)
    const expectedError = new Errors.InternalServerError().message

    expect(promise).rejects.toBe(expectedError)
  })

  it('should throw API error when request fails with non-500 status code', async () => {
    const apiErrorMock = {
      detail: 'Invalid record configuration'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })
    const { sut } = makeSut()

    const promise = sut(fixtures.recordMock)

    expect(promise).rejects.toBe('Invalid record configuration')
  })
})
