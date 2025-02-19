import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listTieredCache } from '@/services/real-time-events-service/tiered-cache'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  tieredCache: {
    configurationId: 'config-001',
    host: 'example.com',
    requestUri: '/example',
    requestMethod: 'GET',
    upstreamCacheStatus: 'HIT',
    proxyHost: 'proxy.example.com',
    source: 'CDN',
    ts: '2024-02-23T18:07:25.000Z'
  }
}

const makeSut = () => {
  const sut = listTieredCache

  return {
    sut
  }
}

describe('tieredCacheServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { l2CacheEvents: [] } }
    })
    const { sut } = makeSut()
    const datasetName = 'l2CacheEvents'
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
      `\t\tconfigurationId`,
      `\t\thost`,
      `\t\trequestUri`,
      `\t\trequestMethod`,
      `\t\tupstreamCacheStatus`,
      `\t\tts`,
      `\t\tproxyHost`,
      `\t\tsource`,
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
      body: { data: { l2CacheEvents: [fixtures.tieredCache] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      data: [
        {
          id: 'mocked-timestamp',
          configurationId: fixtures.tieredCache.configurationId,
          host: fixtures.tieredCache.host,
          requestUri: fixtures.tieredCache.requestUri,
          requestMethod: fixtures.tieredCache.requestMethod,
          upstreamCacheStatus: {
            content: fixtures.tieredCache.upstreamCacheStatus,
            severity: 'info'
          },
          proxyHost: fixtures.tieredCache.proxyHost,
          source: fixtures.tieredCache.source,
          ts: fixtures.tieredCache.ts,
          tsFormat: 'February 23, 2024 at 06:07 PM'
        }
      ]
    })
  })
})
