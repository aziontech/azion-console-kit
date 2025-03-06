import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createRecordsService } from '@/services/edge-dns-records-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  recordMock: {
    edgeDNSID: '123456',
    selectedRecordType: 'A',
    selectedPolicy: 'simple',
    name: 'test.domain.com',
    value: '192.168.0.1',
    ttl: 3600,
    description: 'Test record',
    weight: 10,
    id: '789'
  }
}

const makeSut = () => {
  const sut = createRecordsService
  return { sut }
}

describe('EdgeDNSRecordsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: '123'
        }
      }
    })
    const { sut } = makeSut()

    await sut(fixtures.recordMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_dns/zones/${fixtures.recordMock.edgeDNSID}/records`,
      method: 'POST',
      body: {
        record_type: fixtures.recordMock.selectedRecordType,
        policy: fixtures.recordMock.selectedPolicy,
        entry: fixtures.recordMock.name,
        answers_list: [fixtures.recordMock.value],
        ttl: fixtures.recordMock.ttl,
        description: fixtures.recordMock.description,
        weight: fixtures.recordMock.weight
      }
    })
  })

  it('should return feedback and URL when successfully creating a record', async () => {
    const createdRecordId = '123'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: createdRecordId
        }
      }
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.recordMock)

    expect(result).toEqual({
      feedback: 'Edge DNS Record has been created',
      urlToEditView: `/edge-dns/edit/${fixtures.recordMock.id}/records/edit/${createdRecordId}`
    })
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: {
        detail: 'Internal server error'
      }
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.recordMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })

  it('should throw parsing api error when request fails with non-500 status code', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.recordMock)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })
})
