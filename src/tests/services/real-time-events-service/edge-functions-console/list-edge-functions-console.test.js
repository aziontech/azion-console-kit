import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeFunctionsConsole } from '@/services/real-time-events-service/edge-functions-console'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

vi.mock('@/modules/filter-loaders/dataset-fields-loader', () => ({
  loadDatasetFields: vi.fn().mockResolvedValue([]),
  getDatasetFields: vi
    .fn()
    .mockReturnValue(['configurationId', 'functionId', 'id', 'level', 'lineSource', 'ts', 'line'])
}))

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
      body: { data: { functionConsoleEvents: [] } }
    })
    const { sut } = makeSut()
    await sut(fixtures.filter)

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'v4/events/graphql',
        method: 'POST',
        baseURL: '/',
        body: expect.objectContaining({
          variables: {
            tsRange_begin: '2024-02-23T18:07:25',
            tsRange_end: '2024-02-23T19:07:25'
          }
        })
      })
    )
  })

  it('should parsed correctly each event', async () => {
    vi.mock('@/helpers/generate-timestamp', () => ({
      generateCurrentTimestamp: () => 'mocked-timestamp'
    }))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { functionConsoleEvents: [fixtures.edgeFunctionConsole] } }
    })

    const { sut } = makeSut()
    const response = await sut(fixtures.filter)

    expect(response).toEqual({
      data: [
        {
          id: 'mocked-timestamp',
          configurationId: fixtures.edgeFunctionConsole.configurationId,
          line: fixtures.edgeFunctionConsole.line,
          summary: [
            { key: 'configurationId', value: fixtures.edgeFunctionConsole.configurationId },
            { key: 'functionId', value: fixtures.edgeFunctionConsole.functionId },
            { key: 'level', value: fixtures.edgeFunctionConsole.level },
            { key: 'line', value: fixtures.edgeFunctionConsole.line },
            { key: 'lineSource', value: fixtures.edgeFunctionConsole.lineSource }
          ],
          ts: fixtures.edgeFunctionConsole.ts,
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
