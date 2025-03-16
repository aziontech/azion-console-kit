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
  httpRequestFirst: {
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
  },
  httpRequestSecond: {
    serverAddr: '10.0.0.1',
    serverPort: '443'
  }
}

const makeSut = () => {
  const sut = loadHttpRequest
  return { sut }
}

describe('HttpRequestServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi
      .spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { data: { httpEvents: [] } }
      })
      .mockResolvedValueOnce({
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

  it('should parse and merge events correctly', async () => {
    localeMock()

    vi.spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { data: { httpEvents: [fixtures.httpRequestFirst] } }
      })
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { data: { httpEvents: [fixtures.httpRequestSecond] } }
      })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      data: [
        { key: 'bytesSent', value: fixtures.httpRequestFirst.bytesSent },
        { key: 'configurationId', value: fixtures.httpRequestFirst.configurationId },
        { key: 'debugLog', value: '-' },
        { key: 'geolocAsn', value: fixtures.httpRequestFirst.geolocAsn },
        { key: 'geolocCountryName', value: fixtures.httpRequestFirst.geolocCountryName },
        { key: 'geolocRegionName', value: fixtures.httpRequestFirst.geolocRegionName },
        { key: 'host', value: fixtures.httpRequestFirst.host },
        { key: 'httpReferer', value: fixtures.httpRequestFirst.httpReferer },
        { key: 'httpUserAgent', value: fixtures.httpRequestFirst.httpUserAgent },
        { key: 'remoteAddress', value: fixtures.httpRequestFirst.remoteAddress },
        { key: 'remotePort', value: fixtures.httpRequestFirst.remotePort },
        { key: 'requestId', value: fixtures.httpRequestFirst.requestId },
        { key: 'requestLength', value: fixtures.httpRequestFirst.requestLength },
        { key: 'requestMethod', value: fixtures.httpRequestFirst.requestMethod },
        { key: 'requestTime', value: fixtures.httpRequestFirst.requestTime },
        { key: 'requestUri', value: fixtures.httpRequestFirst.requestUri },
        { key: 'scheme', value: fixtures.httpRequestFirst.scheme },
        { key: 'sentHttpContentType', value: fixtures.httpRequestFirst.sentHttpContentType },
        { key: 'serverAddr', value: fixtures.httpRequestSecond.serverAddr },
        { key: 'serverPort', value: fixtures.httpRequestSecond.serverPort },
        { key: 'serverProtocol', value: '-' },
        { key: 'sslCipher', value: fixtures.httpRequestFirst.sslCipher },
        { key: 'sslProtocol', value: fixtures.httpRequestFirst.sslProtocol },
        { key: 'stacktrace', value: '-' },
        { key: 'status', value: fixtures.httpRequestFirst.status },
        { key: 'tcpinfoRtt', value: fixtures.httpRequestFirst.tcpinfoRtt },
        { key: 'upstreamAddr', value: fixtures.httpRequestFirst.upstreamAddr },
        { key: 'upstreamBytesReceived', value: fixtures.httpRequestFirst.upstreamBytesReceived },
        { key: 'upstreamBytesSent', value: fixtures.httpRequestFirst.upstreamBytesSent },
        { key: 'upstreamCacheStatus', value: '-' },
        { key: 'upstreamResponseTime', value: fixtures.httpRequestFirst.upstreamResponseTime },
        { key: 'upstreamStatus', value: fixtures.httpRequestFirst.upstreamStatus },
        { key: 'wafBlock', value: '-' },
        { key: 'wafLearning', value: '-' },
        { key: 'wafMatch', value: '-' },
        { key: 'wafScore', value: '-' },
        { key: 'wafTotalBlocked', value: '-' },
        { key: 'wafTotalProcessed', value: fixtures.httpRequestFirst.wafTotalProcessed }
      ],
      host: fixtures.httpRequestFirst.host,
      remoteAddress: fixtures.httpRequestFirst.remoteAddress,
      remotePort: fixtures.httpRequestFirst.remotePort,
      requestId: fixtures.httpRequestFirst.requestId,
      scheme: fixtures.httpRequestFirst.scheme,
      ts: 'February 23, 2024 at 06:07:25 PM'
    })
  })
})
