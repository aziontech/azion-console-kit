import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadTieredCache } from '@/services/real-time-events-service/tiered-cache'
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
  tieredCache: {
    bytesSent: 123456,
    cacheKey: '312',
    cacheTtl: 123,
    configurationId: 'config-001',
    host: 'example.com',
    clientId: 'client-123',
    proxyHost: 'proxy.example.com',
    proxyStatus: 'active',
    proxyUpstream: 'upstream-service',
    referenceError: 'none',
    remoteAddr: '192.168.1.1',
    remotePort: 8080,
    requestLength: 1000,
    requestMethod: 'GET',
    requestTime: 0.5,
    requestUri: '/api/data',
    scheme: 'HTTPS',
    sentHttpContentType: 'application/json',
    serverProtocol: 'HTTP/2.0',
    solution: 'caching',
    status: 200,
    tcpinfoRtt: 50,
    ts: '2024-02-23T18:07:25.000Z',
    upstreamBytesReceived: 2048,
    upstreamBytesReceivedStr: '2KB',
    upstreamCacheStatus: 'MISS',
    upstreamConnectTime: 0.1,
    upstreamHeaderTime: 0.2,
    upstreamResponseTime: 0.3,
    upstreamStatus: 200,
    source: 'CDN'
  }
}

const makeSut = () => {
  const sut = loadTieredCache

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

  it('should parsed correctly each event', async () => {
    localeMock()
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { l2CacheEvents: [fixtures.tieredCache] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      scheme: fixtures.tieredCache.scheme,
      proxyHost: fixtures.tieredCache.proxyHost,
      serverProtocol: fixtures.tieredCache.serverProtocol,
      ts: 'February 23, 2024 at 06:07 PM',
      data: [
        { key: 'bytesSent', value: fixtures.tieredCache.bytesSent },
        { key: 'cacheKey', value: fixtures.tieredCache.cacheKey },
        { key: 'cacheTtl', value: fixtures.tieredCache.cacheTtl },
        { key: 'clientId', value: fixtures.tieredCache.clientId },
        { key: 'configurationId', value: fixtures.tieredCache.configurationId },
        { key: 'host', value: fixtures.tieredCache.host },
        { key: 'proxyHost', value: fixtures.tieredCache.proxyHost },
        { key: 'proxyStatus', value: fixtures.tieredCache.proxyStatus },
        { key: 'proxyUpstream', value: fixtures.tieredCache.proxyUpstream },
        { key: 'referenceError', value: fixtures.tieredCache.referenceError },
        { key: 'remoteAddr', value: fixtures.tieredCache.remoteAddr },
        { key: 'remotePort', value: fixtures.tieredCache.remotePort },
        { key: 'requestLength', value: fixtures.tieredCache.requestLength },
        { key: 'requestMethod', value: fixtures.tieredCache.requestMethod },
        { key: 'requestTime', value: fixtures.tieredCache.requestTime },
        { key: 'requestUri', value: fixtures.tieredCache.requestUri },
        { key: 'scheme', value: fixtures.tieredCache.scheme },
        { key: 'sentHttpContentType', value: fixtures.tieredCache.sentHttpContentType },
        { key: 'serverProtocol', value: fixtures.tieredCache.serverProtocol },
        { key: 'solution', value: fixtures.tieredCache.solution },
        { key: 'source', value: fixtures.tieredCache.source },
        { key: 'status', value: fixtures.tieredCache.status },
        { key: 'tcpinfoRtt', value: fixtures.tieredCache.tcpinfoRtt },
        { key: 'upstreamBytesReceived', value: fixtures.tieredCache.upstreamBytesReceived },
        { key: 'upstreamBytesReceivedStr', value: fixtures.tieredCache.upstreamBytesReceivedStr },
        { key: 'upstreamCacheStatus', value: fixtures.tieredCache.upstreamCacheStatus },
        { key: 'upstreamConnectTime', value: fixtures.tieredCache.upstreamConnectTime },
        { key: 'upstreamHeaderTime', value: fixtures.tieredCache.upstreamHeaderTime },
        { key: 'upstreamResponseTime', value: fixtures.tieredCache.upstreamResponseTime },
        { key: 'upstreamStatus', value: fixtures.tieredCache.upstreamStatus }
      ]
    })
  })
})
