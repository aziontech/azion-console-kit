import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listActivityHistory } from '@/services/real-time-events-service/activity-history'
import { describe, expect, it, vi } from 'vitest'

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
    authorEmail: 'email',
    authorName: 'name',
    userId: 'userId',
    title: 'title',
    comment: 'comment',
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

    const datasetName = 'activityHistoryEvents'
    const { sut } = makeSut()
    await sut(fixtures.filter)

    const query = [
      `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {`,
      `  ${datasetName} (`,
      `    limit: 10000`,
      `    orderBy: [ts_ASC]`,
      `    filter: {`,
      `      tsRange: { begin: $tsRange_begin, end: $tsRange_end }`,
      `    }`,
      `  ) {`,
      `    accountId`,
      `    authorEmail`,
      `    authorName`,
      `    userId`,
      `    title`,
      `    comment`,
      `    ts`,
      `  }`,
      `}`
    ].join('\n')

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/events/graphql',
      method: 'POST',
      signal: undefined,
      body: {
        query,
        variables: {
          tsRange_begin: '2024-02-23T18:07:25',
          tsRange_end: '2024-02-23T19:07:25'
        }
      },
      headers: undefined
    })
  })

  it('should parsed correctly each event', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { activityHistoryEvents: [fixtures.activityHistory] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual([
      {
        accountId: fixtures.activityHistory.accountId,
        authorEmail: fixtures.activityHistory.authorEmail,
        authorName: fixtures.activityHistory.authorName,
        userId: fixtures.activityHistory.userId,
        title: fixtures.activityHistory.title,
        comment: fixtures.activityHistory.comment,
        ts: fixtures.activityHistory.ts
      }
    ])
  })
})
