import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeFunctions } from '@/services/real-time-events-service/edge-functions'
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
  edgeFunction: {
    configurationId: '123',
    edgeFunctionsInstanceIdList: ['instance-456', 'instance-789'],
    edgeFunctionsInitiatorTypeList: ['typeA', 'typeB'],
    edgeFunctionsList: 'function-1; function-2; function-3',
    edgeFunctionsSolutionId: 'solution-abc',
    edgeFunctionsTime: new Date().toISOString(),
    functionLanguage: 'JavaScript',
    ts: '2024-02-23T18:07:25.000Z',
    source: 'source',
    virtualhostid: 213
  }
}

const makeSut = () => {
  const sut = loadEdgeFunctions

  return {
    sut
  }
}

describe('DataStreamingServices', () => {
  it('should call GraphQL with correct filter', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { edgeFunctionsEvents: [] } }
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
      body: { data: { edgeFunctionsEvents: [fixtures.edgeFunction] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      id: '2024-02-23T18:07:25.000Z123',
      configurationId: fixtures.edgeFunction.configurationId,
      edgeFunctionsInstanceIdList: fixtures.edgeFunction.edgeFunctionsInstanceIdList,
      edgeFunctionsInitiatorTypeList: fixtures.edgeFunction.edgeFunctionsInitiatorTypeList,
      edgeFunctionsList: ['function-1', ' function-2', ' function-3'],
      edgeFunctionsSolutionId: fixtures.edgeFunction.edgeFunctionsSolutionId,
      edgeFunctionsTime: fixtures.edgeFunction.edgeFunctionsTime,
      functionLanguage: fixtures.edgeFunction.functionLanguage,
      source: fixtures.edgeFunction.source,
      virtualHostId: fixtures.edgeFunction.virtualhostid,
      ts: 'February 23, 2024 at 06:07 PM'
    })
  })
})
