import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteRecordsService } from '@/services/edge-dns-records-services/v4/delete-record-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeDNSID: '550e8400-e29b-41d4-a716-446655440000',
  recordID: '123456789'
}

const makeSut = () => {
  const sut = deleteRecordsService
  return { sut }
}

describe('EdgeDNSRecordsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    await sut({
      edgeDNSID: fixtures.edgeDNSID,
      recordID: fixtures.recordID
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_dns/zones/${fixtures.edgeDNSID}/records/${fixtures.recordID}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    const feedback = await sut({
      edgeDNSID: fixtures.edgeDNSID,
      recordID: fixtures.recordID
    })

    expect(feedback).toBe('Edge DNS Record successfully deleted')
  })

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut({
      edgeDNSID: fixtures.edgeDNSID,
      recordID: fixtures.recordID
    })

    expect(apiErrorResponse).rejects.toBe('api error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut({
      edgeDNSID: fixtures.edgeDNSID,
      recordID: fixtures.recordID
    })
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
