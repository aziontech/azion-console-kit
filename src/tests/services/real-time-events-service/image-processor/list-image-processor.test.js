import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listImageProcessor } from '@/services/real-time-events-service/image-processor'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  imageProcessor: {
    configurationId: 'config-001',
    host: 'example.com',
    requestUri: '/image.jpg',
    status: 200,
    bytesSent: 123456,
    httpReferer: 'https://example.com',
    httpUserAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.101.76 Safari/537.36',
    ts: '2024-02-23T18:07:25'
  }
}

const makeSut = () => {
  const sut = listImageProcessor

  return {
    sut
  }
}

describe('ImageProcessorServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { httpRequest: [] } }
    })
    const { sut } = makeSut()
    const datasetName = 'imagesProcessedEvents'
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
      `\t\tconfigurationId`,
      `\t\thost`,
      `\t\trequestUri`,
      `\t\tstatus`,
      `\t\tbytesSent`,
      `\t\thttpReferer`,
      `\t\tts`,
      `\t\thttpUserAgent`,
      `\t}`,
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
      body: { data: { imagesProcessedEvents: [fixtures.imageProcessor] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      data: [
        {
          id: 'mocked-timestamp',
          configurationId: fixtures.imageProcessor.configurationId,
          httpReferer: fixtures.imageProcessor.httpReferer,
          httpUserAgent: fixtures.imageProcessor.httpUserAgent,
          summary: [
            { key: 'bytesSent', value: fixtures.imageProcessor.bytesSent },
            { key: 'configurationId', value: fixtures.imageProcessor.configurationId },
            { key: 'host', value: fixtures.imageProcessor.host },
            { key: 'httpReferer', value: fixtures.imageProcessor.httpReferer },
            { key: 'httpUserAgent', value: fixtures.imageProcessor.httpUserAgent },
            { key: 'requestUri', value: fixtures.imageProcessor.requestUri },
            { key: 'status', value: fixtures.imageProcessor.status }
          ],
          ts: fixtures.imageProcessor.ts,
          tsFormat: 'February 23, 2024 at 06:07 PM'
        }
      ],
      recordsFound: '1'
    })
  })
})
