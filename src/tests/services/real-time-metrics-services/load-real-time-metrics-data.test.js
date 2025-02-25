import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadRealTimeMetricsData } from '@/services/real-time-metrics-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@services/axios/errors'

const makeSut = () => {
  const sut = loadRealTimeMetricsData

  return {
    sut
  }
}

const fixtures = {
  query: { query: 'test' },
  signal: new AbortController().signal,
  formattedQuery: JSON.stringify({ query: 'test' }),
  apiResponse: { data: { data: { dataset: [] } } },
  formattedResponse: { data: { dataset: [] } }
}

describe('RealTimeMetricsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.apiResponse
    })

    const { sut } = makeSut()
    const version = 'v4'

    await sut({ query: fixtures.query, signal: fixtures.signal })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/metrics/graphql`,
      method: 'POST',
      baseURL: '/',
      body: fixtures.formattedQuery,
      signal: fixtures.signal
    })
  })

  it('should return data on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.apiResponse
    })

    const { sut } = makeSut()
    const response = await sut({ query: fixtures.query, signal: fixtures.signal })

    expect(response).toEqual(fixtures.formattedResponse)
  })

  it.each([
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
