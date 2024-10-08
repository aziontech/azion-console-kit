import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createFunctionService } from '@/services/edge-application-functions-services/create-function-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  functionMock: {
    id: 1656563,
    name: 'FunctionName',
    edgeFunctionID: 34253,
    args: '{"key":"value"}'
  }
}

const makeSut = () => {
  const sut = createFunctionService

  return {
    sut
  }
}

describe('EdgeFirewallFunctionsServices', () => {
  it('should call API with correct params and parse args as JSON', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      statusCode: 201,
      body: {
        results: {
          id: 'funcInstance123'
        }
      }
    })
    const { sut } = makeSut()

    await sut(fixtures.functionMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${fixtures.functionMock.id}/functions_instances`,
      method: 'POST',
      body: {
        name: fixtures.functionMock.name,
        edge_function_id: fixtures.functionMock.edgeFunctionID,
        args: JSON.parse(fixtures.functionMock.args)
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {}
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.functionMock)

    expect(data.feedback).toBe('Your Function has been created')
  })

  it('Should return an API error for a 400 response status', async () => {
    const errorKey = 'function_name_already_in_use'
    const apiErrorMock = 'FunctionName'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      statusCode: 400,
      body: {
        [errorKey]: [apiErrorMock]
      }
    })

    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.functionMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
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

      const response = sut(fixtures.functionMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
