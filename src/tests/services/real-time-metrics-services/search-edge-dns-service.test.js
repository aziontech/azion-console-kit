import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { searchEdgeDnsService } from '@/services/real-time-metrics-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@services/axios/errors'

const makeSut = () => {
  const sut = searchEdgeDnsService

  return {
    sut
  }
}

const fixtures = {
  apiResponse: {
    results: [
      { id: 1, name: 'test', value: 1 },
      { id: 2, name: 'test2', value: 2 }
    ]
  },
  formattedResponse: [
    { value: 1, label: 'test' },
    { value: 2, label: 'test2' }
  ]
}

describe('RealTimeMetricsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.apiResponse
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/intelligent_dns?order_by=name&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should return a list of edge dns', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.apiResponse
    })

    const { sut } = makeSut()
    const results = await sut({})

    expect(results).toEqual(fixtures.formattedResponse)
  })

  it.each([
    {
      statusCode: 400,
      params: {
        orderBy: 'name',
        sort: 'asc',
        page: 1,
        pageSize: 100
      },
      expectedError: new Errors.InvalidApiRequestError().message
    },
    {
      statusCode: 403,
      params: {
        orderBy: 'name',
        sort: 'desc',
        page: 1,
        pageSize: 100
      },
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      params: {
        orderBy: 'name',
        sort: 'asc',
        page: 2,
        pageSize: 100
      },
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      params: {
        orderBy: 'name',
        sort: 'asc',
        page: 1,
        pageSize: 200
      },
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      params: {
        orderBy: 'name',
        sort: 'asc',
        page: 2,
        pageSize: 100
      },
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, params, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: []
      })
      const { sut } = makeSut()

      const response = sut(params)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
