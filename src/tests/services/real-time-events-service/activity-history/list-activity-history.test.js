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

    const datasetName = 'activityHistoryEvents'
    const { sut } = makeSut()
    await sut(fixtures.filter)

    const query = [
      `query (`,
      `\t$tsRange_begin: DateTime!`,
      `\t$tsRange_end: DateTime!`,
      `) {`,
      `\t${datasetName} (`,
      `\t\tlimit: 10000`,
      `\t\torderBy: [ts_ASC]`,
      `\t\tfilter: {`,
      `\t\t\ttsRange: { begin: $tsRange_begin, end: $tsRange_end }`,
      `\t\t}`,
      `\t) {`,
      `\t\tuserIp`,
      `\t\tauthorName`,
      `\t\ttitle`,
      `\t\tresourceType`,
      `\t\tresourceId`,
      `\t\tuserId`,
      `\t\tts`,
      `\t}`,
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
    vi.mock('@/helpers/generate-timestamp', () => ({
      generateCurrentTimestamp: () => 'mocked-timestamp'
    }))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { activityHistoryEvents: [fixtures.activityHistory] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      data: [
        {
          id: 'mocked-timestamp',
          summary: [
            {
              key: 'authorName',
              value: fixtures.activityHistory.authorName
            },
            {
              key: 'resourceId',
              value: fixtures.activityHistory.resourceId
            },
            {
              key: 'resourceType',
              value: fixtures.activityHistory.resourceType
            },
            {
              key: 'title',
              value: fixtures.activityHistory.title
            },
            {
              key: 'userId',
              value: fixtures.activityHistory.userId
            },
            {
              key: 'userIp',
              value: fixtures.activityHistory.userIp
            }
          ],
          ts: fixtures.activityHistory.ts,
          tsFormat: 'February 23, 2024 at 06:07 PM'
        }
      ],
      recordsFound: '1'
    })
  })
})
