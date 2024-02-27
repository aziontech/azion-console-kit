import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listL2Cache } from '@/services/real-time-events-service/l2-cache'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  l2Cache: {
    bytesSent: 123456,
    cacheKey: '312',
    cacheTtl: 123,
    clientId: 'client-123',
    configurationId: 'config-001',
    host: 'example.com',
    proxyHost: 'proxy.example.com',
    source: 'CDN',
    ts: new Date('2024-02-23T18:07:25Z').toISOString()
  }
}

const makeSut = () => {
  const sut = listL2Cache

  return {
    sut
  }
}

describe('L2CacheServices', () => {
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
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { l2CacheEvents: [fixtures.l2Cache] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual([
      {
        id: '2024-02-23T18:07:25.000Zconfig-001',
        bytesSent: fixtures.l2Cache.bytesSent,
        cacheKey: {
          content: fixtures.l2Cache.cacheKey
        },
        cacheTtl: fixtures.l2Cache.cacheTtl,
        clientId: fixtures.l2Cache.clientId,
        configurationId: fixtures.l2Cache.configurationId,
        host: fixtures.l2Cache.host,
        proxyHost: fixtures.l2Cache.proxyHost,
        source: fixtures.l2Cache.source,
        ts: fixtures.l2Cache.ts
      }
    ])
  })
})
