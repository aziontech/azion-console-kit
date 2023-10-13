import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import {
  InternalServerError,
  InvalidApiRequestError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from '@/services/axios/errors'
import { deleteDataStreamingService } from '@/services/data-streaming-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteDataStreamingService

  return {
    sut
  }
}

describe('DataStreamingServices', () => {
  it('should call api with correct params', async () => {
    const httpClientSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      statusCode: 201
    })
    const deleteIdMock = 12346654
    const { sut } = makeSut()

    await sut(deleteIdMock)

    expect(httpClientSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `data_streaming/streamings/${deleteIdMock}`
    })
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new InvalidApiRequestError().message
    },
    {
      statusCode: 401,
      expectedError: new InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new UnexpectedError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
        statusCode,
        body: null
      })
      const deleteIdMock = 332211
      const { sut } = makeSut()

      const response = sut(deleteIdMock)

      expect(response).rejects.toThrow(expectedError)
    }
  )
})
