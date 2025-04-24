import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeFunctions } from '@/services/real-time-events-service/edge-functions'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

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
      `\t\torderBy: [ts_DESC]`,
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
      `\t\tvirtualhostid`,
      `\t\tedgeFunctionsInstanceIdList`,
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
          summary: [
            { key: 'configurationId', value: fixtures.edgeFunction.configurationId },
            {
              key: 'edgeFunctionsInitiatorTypeList',
              value: fixtures.edgeFunction.edgeFunctionsInitiatorTypeList
            },
            { key: 'edgeFunctionsList', value: 'function-1; function-2; function-3' },
            { key: 'edgeFunctionsTime', value: fixtures.edgeFunction.edgeFunctionsTime },
            { key: 'functionLanguage', value: fixtures.edgeFunction.functionLanguage }
          ],
          ts: fixtures.edgeFunction.ts,
          tsFormat: 'February 23, 2024 at 06:07:25 PM'
        }
      ]
    })
  })

  it.each([
    {
      apiErrorMock: 'Access denied. You do not have permission to access this resource.',
      statusCode: 403
    },
    {
      apiErrorMock: 'You have exceeded the limit amount allowed for selected fields (37 fields)',
      statusCode: 400
    }
  ])('Should return an API error for an $statusCode', async ({ statusCode, apiErrorMock }) => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: statusCode,
      body: {
        detail: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.variableMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.filter)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
