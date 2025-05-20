import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { listActivityHistoryEventsService } from '@/services/activity-history-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import graphQLApi from '../../../services/axios/makeEventsApi'

const records = [
  {
    ts: '2023-10-25T15:00:00Z',
    title: 'xxx was deleted',
    comment: '-',
    type: 'deleted',
    authorName: 'dummy',
    authorEmail: 'dummy@dummy.com',
    accountId: '-'
  }
]

const makeSut = () => {
  const sut = listActivityHistoryEventsService

  return { sut }
}

describe('ListActivityHistoryService', () => {
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
    await sut({ apiClient })
    const offSetEnd = new Date()
    const offSetStart = new Date(
      Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - 30)
    )
    const payload = {
      operatioName: 'ActivityHistory',
      query: `query ActivityHistory { activityHistoryEvents( offset: 0 limit: 1000, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}"} }, orderBy: [ts_DESC] ) { ts title comment type authorName authorEmail accountId } } `
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
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { activityHistoryEvents: records } }
    })
    const { sut } = makeSut()
    const result = await sut({})
    expect(result).toEqual([
      {
        authorEmail: records[0].authorEmail,
        authorName: records[0].authorName,
        title: records[0].title,
        ts: Intl.DateTimeFormat('us', {
          dateStyle: 'full',
          timeStyle: 'short'
        }).format(new Date(records[0].ts)),
        type: records[0].type
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
