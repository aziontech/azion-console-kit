import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import beholderGQL from '@/services/axios/makeBeholderGQL'
import { fetchDataFromBeholderService } from '@/services/metrics-services'
import * as Errors from '@services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  beholderQL: {
    query: `query () {}`,
    variables: { var1: '' }
  },
  resultMock: {
    body: [1, 2],
    statusCode: 200
  }
}

const makeSut = () => {
  const sut = fetchDataFromBeholderService

  return {
    sut
  }
}

describe('MetricsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut(fixtures.beholderQL)

    expect(requestSpy).toHaveBeenCalledWith(
      {
        url: '',
        method: 'POST',
        body: fixtures.beholderQL
      },
      beholderGQL
    )
  })

  it('should return correct query', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: fixtures.resultMock.statusCode,
      body: fixtures.resultMock.body
    })
    const { sut } = makeSut()

    const result = await sut({
      query: fixtures.beholderQL.query,
      variables: fixtures.beholderQL.variables
    })

    expect(result).toEqual(fixtures.resultMock.body)
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
    },
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: {
          data: {
            activityHistoryEvents: []
          }
        }
      })
      const { sut } = makeSut()

      const response = sut({})

      expect(response).rejects.toBe(expectedError)
    }
  )
})
