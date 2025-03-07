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
      `\t\tbytesSent`,
      `\t\tcacheKey`,
      `\t\tcacheTtl`,
      `\t\tconfigurationId`,
      `\t\thost`,
      `\t\tproxyHost`,
      `\t\tproxyStatus`,
      `\t\tproxyUpstream`,
      `\t\treferenceError`,
      `\t\tremoteAddr`,
      `\t\tremotePort`,
      `\t\trequestLength`,
      `\t\trequestMethod`,
      `\t\trequestTime`,
      `\t\trequestUri`,
      `\t\tscheme`,
      `\t\tsentHttpContentType`,
      `\t\tserverProtocol`,
      `\t\tsolution`,
      `\t\tstatus`,
      `\t\ttcpinfoRtt`,
      `\t\tts`,
      `\t\tupstreamBytesReceived`,
      `\t\tupstreamBytesReceivedStr`,
      `\t\tupstreamCacheStatus`,
      `\t\tupstreamConnectTime`,
      `\t\tupstreamHeaderTime`,
      `\t\tupstreamResponseTime`,
      `\t\tupstreamStatus`,
      `\t\tclientId`,
      `\t}`,
      `}`
    ].join('\n')

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/events/graphql',
      method: 'POST',
      signal: undefined,
      baseURL: '/',
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
          proxyHost: fixtures.tieredCache.proxyHost,
          summary: [
            { key: 'configurationId', value: fixtures.tieredCache.configurationId },
            { key: 'host', value: fixtures.tieredCache.host },
            { key: 'proxyHost', value: fixtures.tieredCache.proxyHost },
            { key: 'requestMethod', value: fixtures.tieredCache.requestMethod },
            { key: 'requestUri', value: fixtures.tieredCache.requestUri },
            { key: 'upstreamCacheStatus', value: fixtures.tieredCache.upstreamCacheStatus }
          ],
          ts: fixtures.tieredCache.ts,
          tsFormat: 'February 23, 2024 at 06:07:25 PM'
        }
      ]
    })
  })
})
