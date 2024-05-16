import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { listRealTimePurgeService } from '@/services/real-time-purge'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import graphQLApi from '@/services/axios/makeEventsApi'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
  vi.spyOn(window.global.Intl, 'DateTimeFormat').mockImplementation((__, options) =>
    DateTimeFormat(locale, { ...options })
  )
}

const purge = [
  {
    resourceType: 'Purge:url',
    ts: '2023-12-13T18:02:49Z',
    title: 'Purge:url  was created',
    comment: '-',
    type: 'created',
    requestData: '"{\\"items\\": [\\"www.vicva.com\\"], \\"layer\\": \\"edge_cache\\"}"',
    authorName: 'Paulo Sobrinho Ferreira',
    authorEmail: 'paulo.ferreira+teste1@azion.com',
    accountId: '2515'
  }
]

const fixtures = {
  realTimePurgeMock: {
    arguments: ['www.vicva.com'],
    layer: 'edge_cache',
    time: 'Wednesday, December 13, 2023 at 6:02 PM',
    type: 'url',
    user: 'paulo.ferreira+teste1@azion.com'
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
      query: `query ActivityHistory { activityHistoryEvents( offset: 0 limit: 1000, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}"} resourceTypeIn: ["Purge:cachekey", "Purge:url", "Purge:wildcard"] }, orderBy: [ts_DESC] ) { resourceType
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
        layer: 'Edge Cache',
        user: fixtures.realTimePurgeMock.user,
        time: fixtures.realTimePurgeMock.time
      }
    ])
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
