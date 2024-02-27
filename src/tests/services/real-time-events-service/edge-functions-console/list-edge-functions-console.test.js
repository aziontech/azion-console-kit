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
    id: '1234',
    level: 'INFO',
    line: 42,
    lineSource: 'test linesource',
    solutionId: '444',
    source: 'edge-functions-console.js',
    ts: new Date('2024-02-23T18:07:25Z').toISOString()
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
      `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {`,
      `  ${datasetName} (`,
      `    limit: 10000`,
      `    orderBy: [ts_ASC]`,
      `    filter: {`,
      `      tsRange: { begin: $tsRange_begin, end: $tsRange_end }`,
      `    }`,
      `  ) {`,
      `    configurationId`,
      `    functionId`,
      `    id`,
      `    level`,
      `    line`,
      `    lineSource`,
      `    solutionId`,
      `    source`,
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
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { cellsConsoleEvents: [fixtures.edgeFunctionConsole] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual([
      {
        configurationId: fixtures.edgeFunctionConsole.configurationId,
        functionId: fixtures.edgeFunctionConsole.functionId,
        id: fixtures.edgeFunctionConsole.id,
        level: {
          content: 'Info',
          severity: 'info',
          icon: 'pi pi-info-circle'
        },
        line: fixtures.edgeFunctionConsole.line,
        lineSource: { content: fixtures.edgeFunctionConsole.lineSource, severity: 'info' },
        solutionId: fixtures.edgeFunctionConsole.solutionId,
        source: fixtures.edgeFunctionConsole.source,
        ts: fixtures.edgeFunctionConsole.ts
      }
    ])
  })
})
