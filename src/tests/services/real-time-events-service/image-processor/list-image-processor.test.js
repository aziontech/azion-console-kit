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
    bytesSent: 123456,
    configurationId: 'config-001',
    debugLog: true,
    host: 'example.com',
    httpReferer: 'https://example.com',
    httpUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.101.76 Safari/537.36',
    referenceError: 'error',
    ts: new Date('2024-02-23T18:07:25Z').toISOString()
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
      `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {`,
      `  ${datasetName} (`,
      `    limit: 10000`,
      `    orderBy: [ts_ASC]`,
      `    filter: {`,
      `      tsRange: { begin: $tsRange_begin, end: $tsRange_end }`,
      `    }`,
      `  ) {`,
      `    bytesSent`,
      `    configurationId`,
      `    host`,
      `    httpReferer`,
      `    httpUserAgent`,
      `    referenceError`,
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
      headers: undefined,
    } )
  })

  it('should parsed correctly each event', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { imagesProcessedEvents: [fixtures.imageProcessor] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual([
      {
        bytesSent: fixtures.imageProcessor.bytesSent,
        configurationId: fixtures.imageProcessor.configurationId,
        host: fixtures.imageProcessor.host,
        httpReferer: fixtures.imageProcessor.httpReferer,
        httpUserAgent: fixtures.imageProcessor.httpUserAgent,
        referenceError: fixtures.imageProcessor.referenceError,
        ts: fixtures.imageProcessor.ts
      }
    ])
  })
})
