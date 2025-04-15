import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'

import { deleteDataStreamService } from '@/services/data-stream-services/v4'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteDataStreamService

  return {
    sut
  }
}

describe('DataStreamServices', () => {
  it('should call api with correct params', async () => {
    const httpClientSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      statusCode: 200
    })
    const deleteIdMock = 12346654
    const { sut } = makeSut()
    const version = 'v4'
    await sut(deleteIdMock)

    expect(httpClientSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `${version}/data_stream/streams/${deleteIdMock}`
    })
  })

  it('should throw parsing api error when request fails', async () => {
    const deleteIdMock = 12346654

    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(deleteIdMock)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    const deleteIdMock = 12346654
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(deleteIdMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
