import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { searchEdgeFunctionsService } from '@/services/real-time-metrics-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@services/axios/errors'

const makeSut = () => {
  const sut = searchEdgeFunctionsService

  return {
    sut
  }
}

describe('RealTimeMetricsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_functions?order_by=name&sort=asc&page=1&page_size=200`,
      method: 'GET',
      cancelToken: expect.anything()
    })
  })

  it('should return a list of edge functions', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [
          { id: 1, name: 'test' },
          { id: 2, name: 'test2' }
        ]
      }
    })

    const { sut } = makeSut()
    const results = await sut({})

    expect(results).toEqual([
      { value: 1, label: 'test' },
      { value: 2, label: 'test2' }
    ])
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: []
      })
      const { sut } = makeSut()

      const response = sut({})

      expect(response).rejects.toBe(expectedError)
    }
  )
})
