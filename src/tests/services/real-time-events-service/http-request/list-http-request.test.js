import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listHttpRequest } from '@/services/real-time-events-service/http-request'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  httpRequest: {
    configurationId: 'config-001',
    host: 'example.com',
    requestUri: '/api/v1',
    requestMethod: 'GET',
    status: 200,
    requestId: 'req-1234567890',
    ts: '2024-02-23T18:07:25'
  }
}

const makeSut = () => {
  const sut = listHttpRequest

  return {
    sut
  }
}

describe('HttpRequestServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { httpRequest: [] } }
    })
    const { sut } = makeSut()
    const datasetName = 'httpEvents'
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
      `    host`,
      `    requestId`,
      `    requestUri`,
      `    requestMethod`,
      `    status`,
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
      headers: undefined
    })
  })

  it('should parsed correctly each event', async () => {
    vi.mock('@/helpers/generate-timestamp', () => ({
      generateCurrentTimestamp: () => 'mocked-timestamp'
    }))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { httpEvents: [fixtures.httpRequest] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual([
      {
        id: 'mocked-timestamp',
        configurationId: fixtures.httpRequest.configurationId,
        requestMethod: fixtures.httpRequest.requestMethod,
        requestUri: fixtures.httpRequest.requestUri,
        status: fixtures.httpRequest.status,
        host: fixtures.httpRequest.host,
        requestId: fixtures.httpRequest.requestId,
        ts: fixtures.httpRequest.ts,
        tsFormat: 'February 23, 2024 at 06:07 PM'
      }
    ])
  })
})
