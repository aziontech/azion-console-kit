import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadDataStream } from '@/services/real-time-events-service/data-stream'
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
    dataStreamed: 'dataStreamed',
    endpointType: 'endpointType',
    jobName: 'jobName',
    statusCode: 'statusCode',
    streamedLines: 'streamedLines',
    ts: '2024-02-23T18:07:25',
    url: 'https://azion-datastreaming-lbs3-qradar'
  }
}

const makeSut = () => {
  const sut = loadDataStream

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

  it('should parsed correctly event', async () => {
    localeMock()
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { dataStreamedEvents: [fixtures.dataStreaming] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      url: fixtures.dataStreaming.url,
      jobName: {
        content: fixtures.dataStreaming.jobName,
        severity: 'info'
      },
      ts: 'February 23, 2024 at 06:07:25 PM',
      data: [
        { key: 'configurationId', value: fixtures.dataStreaming.configurationId },
        { key: 'dataStreamed', value: fixtures.dataStreaming.dataStreamed },
        { key: 'endpointType', value: fixtures.dataStreaming.endpointType },
        { key: 'jobName', value: 'jobName' },
        { key: 'statusCode', value: fixtures.dataStreaming.statusCode },
        { key: 'streamedLines', value: fixtures.dataStreaming.streamedLines },
        { key: 'url', value: fixtures.dataStreaming.url }
      ]
    })
  })
})
