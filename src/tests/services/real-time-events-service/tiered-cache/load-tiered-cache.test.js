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
      url: 'v4/events/graphql',
      method: 'POST',
      signal: undefined,
      baseURL: '/',
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
      bytesSent: fixtures.tieredCache.bytesSent,
      cacheKey: fixtures.tieredCache.cacheKey,
      cacheTtl: fixtures.tieredCache.cacheTtl,
      configurationId: fixtures.tieredCache.configurationId,
      host: fixtures.tieredCache.host,
      clientId: fixtures.tieredCache.clientId,
      proxyHost: fixtures.tieredCache.proxyHost,
      proxyStatus: fixtures.tieredCache.proxyStatus,
      proxyUpstream: fixtures.tieredCache.proxyUpstream,
      referenceError: fixtures.tieredCache.referenceError,
      remoteAddr: fixtures.tieredCache.remoteAddr,
      remotePort: fixtures.tieredCache.remotePort,
      requestLength: fixtures.tieredCache.requestLength,
      requestMethod: fixtures.tieredCache.requestMethod,
      requestTime: fixtures.tieredCache.requestTime,
      requestUri: fixtures.tieredCache.requestUri,
      scheme: fixtures.tieredCache.scheme,
      sentHttpContentType: fixtures.tieredCache.sentHttpContentType,
      serverProtocol: fixtures.tieredCache.serverProtocol,
      solution: fixtures.tieredCache.solution,
      status: fixtures.tieredCache.status,
      tcpinfoRtt: fixtures.tieredCache.tcpinfoRtt,
      ts: 'February 23, 2024 at 06:07:25 PM',
      upstreamBytesReceived: fixtures.tieredCache.upstreamBytesReceived,
      upstreamBytesReceivedStr: fixtures.tieredCache.upstreamBytesReceivedStr,
      upstreamCacheStatus: fixtures.tieredCache.upstreamCacheStatus,
      upstreamConnectTime: fixtures.tieredCache.upstreamConnectTime,
      upstreamHeaderTime: fixtures.tieredCache.upstreamHeaderTime,
      upstreamResponseTime: fixtures.tieredCache.upstreamResponseTime,
      upstreamStatus: fixtures.tieredCache.upstreamStatus,
      source: fixtures.tieredCache.source
    })
  })
})
