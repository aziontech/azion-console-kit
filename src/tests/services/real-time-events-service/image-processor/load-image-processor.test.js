import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadImageProcessor } from '@/services/real-time-events-service/image-processor'
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
  imageProcessor: {
    bytesSent: 123456,
    configurationId: 'config-001',
    host: 'example.com',
    httpReferer: 'https://example.com',
    httpUserAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.101.76 Safari/537.36',
    referenceError: 'error',
    remoteAddr: '192.0.2.1',
    remotePort: 443,
    requestMethod: 'GET',
    requestTime: '2024-02-23T18:07:25Z',
    requestUri: '/images/processed',
    scheme: 'HTTPS',
    solution: 'optimized',
    sslCipher: 'ECDHE-RSA-AES128-GCM-SHA256',
    sslProtocol: 'TLSv1.2',
    sslSessionReused: 'No',
    status: 200,
    tcpinfoRtt: 100,
    ts: '2024-02-23T18:07:25.000Z',
    upstreamCacheStatus: 'MISS',
    upstreamResponseTime: 0.123,
    upstreamResponseTimeStr: '0.123',
    upstreamStatus: 200,
    upstreamStatusStr: '200 OK'
  }
}

const makeSut = () => {
  const sut = loadImageProcessor

  return {
    sut
  }
}

describe('ImageProcessorServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { imagesProcessedEvents: [] } }
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
      body: { data: { imagesProcessedEvents: [fixtures.imageProcessor] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      bytesSent: fixtures.imageProcessor.bytesSent,
      configurationId: fixtures.imageProcessor.configurationId,
      host: fixtures.imageProcessor.host,
      httpReferer: fixtures.imageProcessor.httpReferer,
      httpUserAgent: fixtures.imageProcessor.httpUserAgent,
      referenceError: fixtures.imageProcessor.referenceError,
      remoteAddr: fixtures.imageProcessor.remoteAddr,
      remotePort: fixtures.imageProcessor.remotePort,
      requestMethod: fixtures.imageProcessor.requestMethod,
      requestTime: fixtures.imageProcessor.requestTime,
      requestUri: fixtures.imageProcessor.requestUri,
      scheme: fixtures.imageProcessor.scheme,
      solution: fixtures.imageProcessor.solution,
      sslCipher: fixtures.imageProcessor.sslCipher,
      sslProtocol: fixtures.imageProcessor.sslProtocol,
      sslSessionReused: fixtures.imageProcessor.sslSessionReused,
      status: fixtures.imageProcessor.status,
      tcpinfoRtt: fixtures.imageProcessor.tcpinfoRtt,
      ts: 'February 23, 2024 at 06:07 PM',
      upstreamCacheStatus: fixtures.imageProcessor.upstreamCacheStatus,
      upstreamResponseTime: fixtures.imageProcessor.upstreamResponseTime,
      upstreamResponseTimeStr: fixtures.imageProcessor.upstreamResponseTimeStr,
      upstreamStatus: fixtures.imageProcessor.upstreamStatus,
      upstreamStatusStr: fixtures.imageProcessor.upstreamStatusStr
    })
  })
})
