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
    bytesSent: 123456,
    cacheKey: '312',
    cacheTtl: 123,
    clientId: 'client-123',
    configurationId: 'config-001',
    host: 'example.com',
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
      `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {`,
      `  ${datasetName} (`,
      `    limit: 10000`,
      `    orderBy: [ts_ASC]`,
      `    filter: {`,
      `      tsRange: { begin: $tsRange_begin, end: $tsRange_end }`,
      `    }`,
      `  ) {`,
      `    bytesSent`,
      `    cacheKey`,
      `    cacheTtl`,
      `    clientId`,
      `    configurationId`,
      `    host`,
      `    proxyHost`,
      `    source`,
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
    vi.mock('@/helpers/generate-timestamp', () => ({
      generateCurrentTimestamp: () => 'mocked-timestamp'
    }))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { l2CacheEvents: [fixtures.tieredCache] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual([
      {
        id: 'mocked-timestamp',
        bytesSent: fixtures.tieredCache.bytesSent,
        cacheKey: {
          content: fixtures.tieredCache.cacheKey
        },
        cacheTtl: fixtures.tieredCache.cacheTtl,
        clientId: fixtures.tieredCache.clientId,
        configurationId: fixtures.tieredCache.configurationId,
        host: fixtures.tieredCache.host,
        proxyHost: fixtures.tieredCache.proxyHost,
        source: fixtures.tieredCache.source,
        ts: fixtures.tieredCache.ts
      }
    ])
  })
})
