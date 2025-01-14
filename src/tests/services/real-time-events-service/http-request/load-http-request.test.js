import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadHttpRequest } from '@/services/real-time-events-service/http-request'
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
  httpRequest: {
    httpReferer: 'https://example.com',
    scheme: 'HTTPS',
    ts: '2024-02-23T18:07:25.000Z',
    httpUserAgent: 'Mozilla/5.0 (compatible; ExampleBot/1.0; +http://example.com/bot)',
    remoteAddress: '192.0.2.1',
    host: 'example.com',
    remotePort: 443,
    upstreamBytesReceived: 1024,
    upstreamBytesSent: 512,
    upstreamAddr: '203.0.113.1',
    upstreamStatus: 200,
    upstreamResponseTime: 150,
    wafTotalProcessed: 10,
    configurationId: 321,
    source: 'exampleSource',
    requestTime: 0.123,
    tcpinfoRtt: 50,
    requestLength: 1024,
    bytesSent: 2048,
    sentHttpContentType: 'text/html; charset=UTF-8',
    requestId: 444,
    sslCipher: 'ECDHE-RSA-AES128-GCM-SHA256',
    requestMethod: 'GET',
    requestUri: '/index.html',
    sslProtocol: 'TLSv1.2',
    status: 200,
    wafScore: 0,
    wafTotalBlocked: 0,
    wafLearning: false,
    wafBlock: false,
    debugLog: null,
    wafMatch: false,
    geolocAsn: 'AS15169',
    stacktrace: null,
    geolocCountryName: 'United States',
    geolocRegionName: 'California'
  }
}

const makeSut = () => {
  const sut = loadHttpRequest

  return {
    sut
  }
}

describe('HttpRequestServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { httpEvents: [] } }
    })
    const { sut } = makeSut()
    await sut(fixtures.filter)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/events/graphql',
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
      body: { data: { httpEvents: [fixtures.httpRequest] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      bytesSent: fixtures.httpRequest.bytesSent,
      configurationId: fixtures.httpRequest.configurationId,
      debugLog: fixtures.httpRequest.debugLog,
      geolocAsn: fixtures.httpRequest.geolocAsn,
      geolocCountryName: fixtures.httpRequest.geolocCountryName,
      geolocRegionName: fixtures.httpRequest.geolocRegionName,
      host: fixtures.httpRequest.host,
      httpReferer: fixtures.httpRequest.httpReferer,
      httpUserAgent: fixtures.httpRequest.httpUserAgent,
      remoteAddress: fixtures.httpRequest.remoteAddress,
      remotePort: fixtures.httpRequest.remotePort,
      requestId: fixtures.httpRequest.requestId,
      requestLength: fixtures.httpRequest.requestLength,
      requestMethod: fixtures.httpRequest.requestMethod,
      requestTime: fixtures.httpRequest.requestTime,
      requestUri: fixtures.httpRequest.requestUri,
      scheme: fixtures.httpRequest.scheme,
      sentHttpContentType: fixtures.httpRequest.sentHttpContentType,
      source: fixtures.httpRequest.source,
      sslCipher: fixtures.httpRequest.sslCipher,
      sslProtocol: fixtures.httpRequest.sslProtocol,
      stacktrace: fixtures.httpRequest.stacktrace,
      status: fixtures.httpRequest.status,
      serverProtocol: undefined,
      upstreamCacheStatus: undefined,
      tcpinfoRtt: fixtures.httpRequest.tcpinfoRtt,
      ts: 'February 23, 2024 at 06:07 PM',
      upstreamAddr: fixtures.httpRequest.upstreamAddr,
      upstreamBytesReceived: fixtures.httpRequest.upstreamBytesReceived,
      upstreamBytesSent: fixtures.httpRequest.upstreamBytesSent,
      upstreamResponseTime: fixtures.httpRequest.upstreamResponseTime,
      upstreamStatus: fixtures.httpRequest.upstreamStatus,
      wafBlock: fixtures.httpRequest.wafBlock,
      wafLearning: fixtures.httpRequest.wafLearning,
      wafMatch: fixtures.httpRequest.wafMatch,
      wafScore: fixtures.httpRequest.wafScore,
      wafTotalBlocked: fixtures.httpRequest.wafTotalBlocked,
      wafTotalProcessed: fixtures.httpRequest.wafTotalProcessed
    })
  })
})
