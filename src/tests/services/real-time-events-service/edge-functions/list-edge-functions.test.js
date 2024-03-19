import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeFunctions } from '@/services/real-time-events-service/edge-functions'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  filter: {
    tsRange: {
      meta: { option: '1' },
      tsRangeBegin: '2024-02-23T18:07:25',
      tsRangeEnd: '2024-02-23T19:07:25'
    }
  },
  edgeFunction: {
    configurationId: '123',
    edgeFunctionsInstanceIdList: ['instance-456', 'instance-789'],
    edgeFunctionsInitiatorTypeList: ['typeA', 'typeB'],
    edgeFunctionsList: 'function-1; function-2; function-3',
    edgeFunctionsSolutionId: 'solution-abc',
    edgeFunctionsTime: new Date().toISOString(),
    functionLanguage: 'JavaScript',
    ts: '2024-02-23T18:07:25.000Z'
  }
}

const makeSut = () => {
  const sut = listEdgeFunctions

  return {
    sut
  }
}

describe('EdgeFunctionsServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { edgeFunctions: [] } }
    })
    const { sut } = makeSut()
    const datasetName = 'edgeFunctionsEvents'
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
      `    edgeFunctionsInstanceIdList`,
      `    edgeFunctionsInitiatorTypeList`,
      `    edgeFunctionsList`,
      `    edgeFunctionsSolutionId`,
      `    edgeFunctionsTime`,
      `    functionLanguage`,
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
      body: { data: { edgeFunctionsEvents: [fixtures.edgeFunction] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual([
      {
        id: 'mocked-timestamp',
        configurationId: fixtures.edgeFunction.configurationId,
        edgeFunctionsInstanceIdList: fixtures.edgeFunction.edgeFunctionsInstanceIdList,
        edgeFunctionsInitiatorTypeList: fixtures.edgeFunction.edgeFunctionsInitiatorTypeList,
        edgeFunctionsList: ['function-1', ' function-2', ' function-3'],
        edgeFunctionsSolutionId: fixtures.edgeFunction.edgeFunctionsSolutionId,
        edgeFunctionsTime: fixtures.edgeFunction.edgeFunctionsTime,
        functionLanguage: fixtures.edgeFunction.functionLanguage,
        ts: fixtures.edgeFunction.ts
      }
    ])
  })
})
