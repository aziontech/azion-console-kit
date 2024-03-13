import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteRecordsService } from '@/services/edge-dns-records-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteRecordsService

  return {
    sut
  }
}

describe('EdgeDnsRecordsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const recordIDMock = 12387555
    const edgeDNSIDMock = 765789
    const { sut } = makeSut()
    const version = 'v3'
    await sut({ recordID: recordIDMock, edgeDNSID: edgeDNSIDMock })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `${version}/intelligent_dns/${edgeDNSIDMock}/records/${recordIDMock}`
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const recordIDMock = 12387555
    const edgeDNSIDMock = 765789

    const { sut } = makeSut()

    const feedbackMessage = await sut({
      recordID: recordIDMock,
      edgeDNSID: edgeDNSIDMock
    })

    expect(feedbackMessage).toBe('Edge DNS Record successfully deleted')
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const recordIDMock = 12387555
      const edgeDNSIDMock = 765789

      const { sut } = makeSut()

      const response = sut({
        recordID: recordIDMock,
        edgeDNSID: edgeDNSIDMock
      })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
