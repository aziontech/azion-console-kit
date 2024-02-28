import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadL2Cache } from '@/services/real-time-events-service/l2-cache'
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
  l2Cache: {
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
  const sut = loadL2Cache

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
      body: { data: { l2CacheEvents: [fixtures.l2Cache] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      bytesSent: fixtures.l2Cache.bytesSent,
      cacheKey: fixtures.l2Cache.cacheKey,
      cacheTtl: fixtures.l2Cache.cacheTtl,
      configurationId: fixtures.l2Cache.configurationId,
      host: fixtures.l2Cache.host,
      clientId: fixtures.l2Cache.clientId,
      proxyHost: fixtures.l2Cache.proxyHost,
      proxyStatus: fixtures.l2Cache.proxyStatus,
      proxyUpstream: fixtures.l2Cache.proxyUpstream,
      referenceError: fixtures.l2Cache.referenceError,
      remoteAddr: fixtures.l2Cache.remoteAddr,
      remotePort: fixtures.l2Cache.remotePort,
      requestLength: fixtures.l2Cache.requestLength,
      requestMethod: fixtures.l2Cache.requestMethod,
      requestTime: fixtures.l2Cache.requestTime,
      requestUri: fixtures.l2Cache.requestUri,
      scheme: fixtures.l2Cache.scheme,
      sentHttpContentType: fixtures.l2Cache.sentHttpContentType,
      serverProtocol: fixtures.l2Cache.serverProtocol,
      solution: fixtures.l2Cache.solution,
      status: fixtures.l2Cache.status,
      tcpinfoRtt: fixtures.l2Cache.tcpinfoRtt,
      ts: 'February 23, 2024 at 06:07 PM',
      upstreamBytesReceived: fixtures.l2Cache.upstreamBytesReceived,
      upstreamBytesReceivedStr: fixtures.l2Cache.upstreamBytesReceivedStr,
      upstreamCacheStatus: fixtures.l2Cache.upstreamCacheStatus,
      upstreamConnectTime: fixtures.l2Cache.upstreamConnectTime,
      upstreamHeaderTime: fixtures.l2Cache.upstreamHeaderTime,
      upstreamResponseTime: fixtures.l2Cache.upstreamResponseTime,
      upstreamStatus: fixtures.l2Cache.upstreamStatus,
      source: fixtures.l2Cache.source
    })
  })
})
