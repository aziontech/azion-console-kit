import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadActivityHistory } from '@/services/real-time-events-service/activity-history'
import { describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  activityHistory: {
    accountId: '1',
    type: 'Type',
    authorEmail: 'email',
    authorName: 'name',
    userId: 'userId',
    title: 'title',
    comment: 'comment',
    ts: '2024-02-23T18:07:25.000Z'
  }
}

const makeSut = () => {
  const sut = loadActivityHistory

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

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/events/graphql',
      method: 'POST',
      signal: undefined,
      body: {
        query: expect.any(String),
        variables: {
          tsRange_begin: '2024-02-23T18:07:25',
          tsRange_end: '2024-02-23T19:07:25'
        }
      },
      headers: undefined
    })
  })

  it('should parsed correctly event', async () => {
    localeMock()
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { activityHistoryEvents: [fixtures.activityHistory] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      accountId: fixtures.activityHistory.accountId,
      authorEmail: fixtures.activityHistory.authorEmail,
      type: fixtures.activityHistory.type,
      authorName: fixtures.activityHistory.authorName,
      userId: fixtures.activityHistory.userId,
      title: fixtures.activityHistory.title,
      comment: fixtures.activityHistory.comment,
      ts: 'February 23, 2024 at 06:07 PM'
    })
  })
})
