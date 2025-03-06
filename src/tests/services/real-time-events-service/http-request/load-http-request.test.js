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
      body: { data: { httpEvents: [fixtures.httpRequest] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      data: [
        { key: 'bytesSent', value: fixtures.httpRequest.bytesSent },
        { key: 'configurationId', value: fixtures.httpRequest.configurationId },
        { key: 'debugLog', value: fixtures.httpRequest.debugLog },
        { key: 'geolocAsn', value: fixtures.httpRequest.geolocAsn },
        { key: 'geolocCountryName', value: fixtures.httpRequest.geolocCountryName },
        { key: 'geolocRegionName', value: fixtures.httpRequest.geolocRegionName },
        { key: 'host', value: fixtures.httpRequest.host },
        { key: 'httpReferer', value: fixtures.httpRequest.httpReferer },
        { key: 'httpUserAgent', value: fixtures.httpRequest.httpUserAgent },
        { key: 'remoteAddress', value: fixtures.httpRequest.remoteAddress },
        { key: 'remotePort', value: fixtures.httpRequest.remotePort },
        { key: 'requestId', value: fixtures.httpRequest.requestId },
        { key: 'requestLength', value: fixtures.httpRequest.requestLength },
        { key: 'requestMethod', value: fixtures.httpRequest.requestMethod },
        { key: 'requestTime', value: fixtures.httpRequest.requestTime },
        { key: 'requestUri', value: fixtures.httpRequest.requestUri },
        { key: 'scheme', value: fixtures.httpRequest.scheme },
        { key: 'sentHttpContentType', value: fixtures.httpRequest.sentHttpContentType },
        { key: 'serverProtocol', value: undefined },
        { key: 'source', value: fixtures.httpRequest.source },
        { key: 'sslCipher', value: fixtures.httpRequest.sslCipher },
        { key: 'sslProtocol', value: fixtures.httpRequest.sslProtocol },
        { key: 'stacktrace', value: fixtures.httpRequest.stacktrace },
        { key: 'status', value: fixtures.httpRequest.status },
        { key: 'tcpinfoRtt', value: fixtures.httpRequest.tcpinfoRtt },
        { key: 'upstreamAddr', value: fixtures.httpRequest.upstreamAddr },
        { key: 'upstreamBytesReceived', value: fixtures.httpRequest.upstreamBytesReceived },
        { key: 'upstreamBytesSent', value: fixtures.httpRequest.upstreamBytesSent },
        { key: 'upstreamCacheStatus', value: undefined },
        { key: 'upstreamResponseTime', value: fixtures.httpRequest.upstreamResponseTime },
        { key: 'upstreamStatus', value: fixtures.httpRequest.upstreamStatus },
        { key: 'wafBlock', value: fixtures.httpRequest.wafBlock },
        { key: 'wafLearning', value: fixtures.httpRequest.wafLearning },
        { key: 'wafMatch', value: fixtures.httpRequest.wafMatch },
        { key: 'wafScore', value: fixtures.httpRequest.wafScore },
        { key: 'wafTotalBlocked', value: fixtures.httpRequest.wafTotalBlocked },
        { key: 'wafTotalProcessed', value: fixtures.httpRequest.wafTotalProcessed }
      ],
      host: fixtures.httpRequest.host,
      remoteAddress: fixtures.httpRequest.remoteAddress,
      remotePort: fixtures.httpRequest.remotePort,
      requestId: fixtures.httpRequest.requestId,
      scheme: fixtures.httpRequest.scheme,
      ts: 'February 23, 2024 at 06:07:25 PM'
    })
  })
})
