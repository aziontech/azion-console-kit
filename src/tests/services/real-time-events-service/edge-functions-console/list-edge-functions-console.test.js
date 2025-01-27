import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeFunctionsConsole } from '@/services/real-time-events-service/edge-functions-console'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  edgeFunctionConsole: {
    configurationId: '123',
    functionId: '1423',
    level: 'INFO',
    line: 42,
    lineSource: 'test linesource',
    source: 'edge-functions-console.js',
    ts: '2024-02-23T18:07:25'
  }
}

const makeSut = () => {
  const sut = listEdgeFunctionsConsole

  return {
    sut
  }
}

describe('EdgeFunctionsConsoleServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { edgeFunctions: [] } }
    })
    const { sut } = makeSut()
    const datasetName = 'cellsConsoleEvents'
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
      `\t\tfunctionId`,
      `\t\tid`,
      `\t\tlevel`,
      `\t\tline`,
      `\t\tlineSource`,
      `\t\tsource`,
      `\t\tts`,
      `\t}`,
      `}`
    ].join('\n')

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/events/graphql',
      method: 'POST',
      signal: undefined,
      baseURL: '/',
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
      body: { data: { cellsConsoleEvents: [fixtures.edgeFunctionConsole] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      data: [
        {
          configurationId: fixtures.edgeFunctionConsole.configurationId,
          functionId: fixtures.edgeFunctionConsole.functionId,
          id: 'mocked-timestamp',
          level: {
            content: 'Info',
            severity: 'info',
            icon: 'pi pi-info-circle'
          },
          line: fixtures.edgeFunctionConsole.line,
          lineSource: { content: fixtures.edgeFunctionConsole.lineSource, severity: 'info' },
          source: fixtures.edgeFunctionConsole.source,
          ts: fixtures.edgeFunctionConsole.ts,
          tsFormat: 'February 23, 2024 at 06:07 PM'
        }
      ],
      recordsFound: '1'
    })
  })
})
