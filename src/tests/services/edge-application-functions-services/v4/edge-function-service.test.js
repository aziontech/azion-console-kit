import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createFunctionService } from '@/services/edge-application-functions-services/v4'
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
      statusCode: 202,
      body: {
        results: {
          id: 'funcInstance123'
        }
      }
    })
    const { sut } = makeSut()

    await sut(fixtures.functionMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${fixtures.functionMock.id}/functions`,
      method: 'POST',
      body: {
        name: fixtures.functionMock.name,
        edge_function: fixtures.functionMock.edgeFunctionID,
        json_args: JSON.parse(fixtures.functionMock.args),
        active: true
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
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

  it('should throw when request fails with status code $statusCode', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })
    const { sut } = makeSut()

    const response = sut(fixtures.functionMock)

    expect(response).rejects.toThrow(new Errors.InternalServerError().message)
  })
})
