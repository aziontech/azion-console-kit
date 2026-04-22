import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listActivityHistory } from '@/services/real-time-events-service/activity-history'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'
import { localeMock } from '@/tests/utils/localeMock'
import { getCurrentTimezone } from '@/helpers'

vi.mock('@/modules/filter-loaders/dataset-fields-loader', () => ({
  loadDatasetFields: vi.fn().mockResolvedValue([]),
  getDatasetFields: vi
    .fn()
    .mockReturnValue([
      'userIp',
      'authorName',
      'title',
      'resourceType',
      'resourceId',
      'userId',
      'ts'
    ])
}))

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  activityHistory: {
    userIp: 'userIp',
    authorName: 'name',
    title: 'title',
    resourceType: 'resourceType',
    resourceId: 'resourceId',
    userId: 'userId',
    ts: '2024-02-23T18:07:25.000Z'
  }
}

const makeSut = () => {
  const sut = listActivityHistory

  return {
    sut
  }
}

describe('ActivityHistoryServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { activityHistoryEvents: [] } }
    })

    const { sut } = makeSut()
    await sut(fixtures.filter)

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'v4/events/graphql',
        method: 'POST',
        baseURL: '/',
        body: expect.objectContaining({
          variables: {
            tsRange_begin: '2024-02-23T18:07:25',
            tsRange_end: '2024-02-23T19:07:25'
          }
        })
      })
    )
  })

  it('should parsed correctly each event', async () => {
    localeMock()
    vi.mock('@/helpers/generate-timestamp', () => ({
      generateCurrentTimestamp: () => 'mocked-timestamp'
    }))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { activityHistoryEvents: [fixtures.activityHistory] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)
    const expectedTsFormat = getCurrentTimezone(fixtures.activityHistory.ts)

    expect(response).toEqual({
      data: [
        {
          id: 'mocked-timestamp',
          summary: [
            { key: 'authorName', value: fixtures.activityHistory.authorName },
            { key: 'resourceId', value: fixtures.activityHistory.resourceId },
            { key: 'resourceType', value: fixtures.activityHistory.resourceType },
            { key: 'title', value: fixtures.activityHistory.title },
            { key: 'userId', value: fixtures.activityHistory.userId },
            { key: 'userIp', value: fixtures.activityHistory.userIp }
          ],
          ts: fixtures.activityHistory.ts,
          userId: fixtures.activityHistory.userId,
          tsFormat: expectedTsFormat
        }
      ]
    })
  })

  it.each([
    {
      apiErrorMock: 'Access denied. You do not have permission to access this resource.',
      statusCode: 403
    },
    {
      apiErrorMock: 'You have exceeded the limit amount allowed for selected fields (37 fields)',
      statusCode: 400
    }
  ])('Should return an API error for an $statusCode', async ({ statusCode, apiErrorMock }) => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: statusCode,
      body: {
        detail: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.variableMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
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
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.filter)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
