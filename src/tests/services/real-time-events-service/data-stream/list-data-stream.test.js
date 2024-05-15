import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listDataStream } from '@/services/real-time-events-service/data-stream'
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
  dataStreaming: {
    configurationId: '1',
    jobName: 'jobName',
    endpointType: 'endpointType',
    url: 'http://url.com',
    statusCode: 'statusCode',
    ts: '2024-02-23T18:07:25',
    dataStreamed: 'dataStreamed',
    source: 'source',
    streamedLines: 'streamedLines'
  }
}

const makeSut = () => {
  const sut = listDataStream

  return {
    sut
  }
}

describe('DataStreamingServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { dataStreamedEvents: [] } }
    })

    const datasetName = 'dataStreamedEvents'

    const { sut } = makeSut()
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
      `    configurationId`,
      `    jobName`,
      `    endpointType`,
      `    url`,
      `    statusCode`,
      `    ts`,
      `    dataStreamed`,
      `    source`,
      `    streamedLines`,
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
    localeMock()
    vi.mock('@/helpers/generate-timestamp', () => ({
      generateCurrentTimestamp: () => 'mocked-timestamp'
    }))

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { dataStreamedEvents: [fixtures.dataStreaming] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual([
      {
        id: 'mocked-timestamp',
        configurationId: fixtures.dataStreaming.configurationId,
        jobName: { content: fixtures.dataStreaming.jobName, severity: 'info' },
        endpointType: { content: fixtures.dataStreaming.endpointType, severity: 'info' },
        url: 'http://url.com',
        statusCode: fixtures.dataStreaming.statusCode,
        ts: fixtures.dataStreaming.ts,
        dataStreamed: fixtures.dataStreaming.dataStreamed,
        source: fixtures.dataStreaming.source,
        streamedLines: fixtures.dataStreaming.streamedLines,
        tsFormat: 'February 23, 2024 at 06:07 PM'
      }
    ])
  })
})
