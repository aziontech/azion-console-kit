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
    functionLanguage: 'JavaScript',
    edgeFunctionsInitiatorTypeList: ['typeA', 'typeB'],
    edgeFunctionsList: 'function-1; function-2; function-3',
    edgeFunctionsTime: '1000',
    ts: '2024-02-23T18:07:25'
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
      `\t\tfunctionLanguage`,
      `\t\tedgeFunctionsInitiatorTypeList`,
      `\t\tedgeFunctionsList`,
      `\t\tedgeFunctionsTime`,
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
      body: { data: { edgeFunctionsEvents: [fixtures.edgeFunction] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      data: [
        {
          id: 'mocked-timestamp',
          configurationId: fixtures.edgeFunction.configurationId,
          functionLanguage: fixtures.edgeFunction.functionLanguage,
          edgeFunctionsInitiatorTypeList: fixtures.edgeFunction.edgeFunctionsInitiatorTypeList,
          edgeFunctionsList: ['function-1', ' function-2', ' function-3'],
          edgeFunctionsTime: `${fixtures.edgeFunction.edgeFunctionsTime}ms`,
          ts: fixtures.edgeFunction.ts,
          tsFormat: 'February 23, 2024 at 06:07 PM'
        }
      ],
      recordsFound: '1'
    })
  })
})
