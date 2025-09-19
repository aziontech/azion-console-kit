import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { listRealTimePurgeService } from '@/services/real-time-purge'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import graphQLApi from '@/services/axios/makeEventsApi'
import { localeMock } from '@/tests/utils/localeMock'

const purge = [
  {
    resourceType: 'Purge:url',
    ts: '2023-12-13T18:02:49Z',
    title: 'Purge:url  was created',
    comment: '-',
    type: 'created',
    requestData: '{\\"items\\": [\\"www.vicva.com\\"], \\"layer\\": \\"cache\\"}',
    authorName: 'Paulo Sobrinho Ferreira',
    authorEmail: 'azion+teste1@azion.com',
    accountId: '2515'
  }
]

const fixtures = {
  realTimePurgeMock: {
    arguments: ['www.vicva.com'],
    disabled: false,
    layer: 'cache',
    time: 'Wednesday, December 13, 2023 at 6:02 PM',
    type: 'url',
    user: 'azion+teste1@azion.com',
    ts: '2023-12-13T18:02:49Z'
  }
}

const makeSut = () => {
  const sut = listRealTimePurgeService

  return { sut }
}

describe('ListRealTimePurgeService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          activityHistoryEvents: []
        }
      }
    })

    const { sut } = makeSut()
    const token = 'token'
    const apiClient = graphQLApi(token)
    await sut(apiClient)
    const offSetEnd = new Date()
    const offSetStart = new Date(
      Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - 30)
    )
    const payload = {
      operatioName: 'ActivityHistory',
      query: `query ActivityHistory { activityHistoryEvents( offset: 0 limit: 1000, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}"} resourceTypeIn: ["Purge:cachekey", "Purge:url", "Purge:wildcard", "Purge:l2cachekey"] }, orderBy: [ts_DESC] ) { resourceType
      ts
      title
      comment
      type
      requestData
      authorName
      authorEmail
      accountId } } `
    }
    expect(requestSpy).toHaveBeenCalledWith(
      {
        url: 'graphql',
        method: 'POST',
        body: payload
      },
      apiClient
    )
  })

  it('should parse correctly each returned item', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { activityHistoryEvents: purge } }
    })
    const { sut } = makeSut()
    const result = await sut({})

    const idExpected = `${purge[0].ts}-0`
    expect(result).toEqual([
      {
        id: idExpected,
        type: 'URL',
        arguments: fixtures.realTimePurgeMock.arguments,
        disabled: false,
        layer: 'Edge Cache',
        user: fixtures.realTimePurgeMock.user,
        time: fixtures.realTimePurgeMock.time,
        ts: fixtures.realTimePurgeMock.ts
      }
    ])
  })

  it('should correctly parse double-escaped requestData', async () => {
    localeMock()
    const doubleEscapedRequestData =
      '{\\"items\\": [\\"www.vicva.com\\"], \\"layer\\": \\"cache\\"}'
    const mockResponse = {
      statusCode: 200,
      body: {
        data: {
          activityHistoryEvents: [
            {
              resourceType: 'Purge:url',
              ts: '2023-12-13T18:02:49Z',
              title: 'Purge:url was created',
              comment: '-',
              type: 'created',
              requestData: doubleEscapedRequestData,
              authorName: 'Paulo Sobrinho Ferreira',
              authorEmail: 'azion+teste1@azion.com',
              accountId: '2515'
            }
          ]
        }
      }
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(mockResponse)

    const apiClient = graphQLApi('token')
    const result = await listRealTimePurgeService(apiClient)

    const expectedParsedData = {
      id: '2023-12-13T18:02:49Z-0',
      type: 'URL',
      arguments: ['www.vicva.com'],
      layer: 'Edge Cache',
      user: 'azion+teste1@azion.com',
      disabled: false,
      time: 'Wednesday, December 13, 2023 at 6:02 PM',
      ts: '2023-12-13T18:02:49Z'
    }

    expect(result).toEqual([expectedParsedData])
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
