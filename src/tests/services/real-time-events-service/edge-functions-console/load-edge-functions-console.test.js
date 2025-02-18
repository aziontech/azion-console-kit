import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeFunctionsConsole } from '@/services/real-time-events-service/edge-functions-console'
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
  edgeFunctionConsole: {
    configurationId: '123',
    functionId: '1423',
    id: '1234',
    level: 'INFO',
    line: 42,
    lineSource: 'test linesource',
    solutionId: '444',
    source: 'edge-functions-console.js',
    ts: '2024-02-23T18:07:25.000Z'
  }
}

const makeSut = () => {
  const sut = loadEdgeFunctionsConsole

  return {
    sut
  }
}

describe('EdgeFunctionsConsoleServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { cellsConsoleEvents: [] } }
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
      body: { data: { cellsConsoleEvents: [fixtures.edgeFunctionConsole] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      configurationId: fixtures.edgeFunctionConsole.configurationId,
      functionId: fixtures.edgeFunctionConsole.functionId,
      id: fixtures.edgeFunctionConsole.id,
      level: {
        content: 'Info',
        severity: 'info',
        icon: 'pi pi-info-circle'
      },
      line: fixtures.edgeFunctionConsole.line,
      lineSource: fixtures.edgeFunctionConsole.lineSource,
      solutionId: fixtures.edgeFunctionConsole.solutionId,
      source: fixtures.edgeFunctionConsole.source,
      ts: 'February 23, 2024 at 06:07 PM'
    })
  })
})
