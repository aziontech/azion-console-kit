import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { searchWorkloadsService } from '@/services/real-time-metrics-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@services/axios/errors'

const makeSut = () => {
  const sut = searchWorkloadsService

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
    const version = 'v4'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/workspace/workloads?fields=id%2C+name&ordering=name&page=1&page_size=50000`,
      method: 'GET'
    })
  })

  it('should return a list of domains', async () => {
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

      const response = sut()

      expect(response).rejects.toBe(expectedError)
    }
  )
})
