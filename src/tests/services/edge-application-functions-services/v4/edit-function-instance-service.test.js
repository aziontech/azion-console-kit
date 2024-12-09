import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editFunctionService } from '@/services/edge-application-functions-services/v4/edit-function-instance-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  functionMock: {
    edgeApplicationID: 3456789876,
    id: 817236,
    name: 'mockFunctionName',
    edgeFunctionID: 123456,
    args: JSON.stringify({
      key1: 'value1',
      key2: 'value2'
    })
  }
}

const makeSut = () => {
  const sut = editFunctionService
  return { sut }
}

describe('EdgeApplicationFunctionInstanceService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    await sut(fixtures.functionMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${fixtures.functionMock.edgeApplicationID}/functions/${fixtures.functionMock.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.functionMock.name,
        edge_function: fixtures.functionMock.edgeFunctionID,
        json_args: JSON.parse(fixtures.functionMock.args)
      }
    })
  })

  it('should return success message when function is updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.functionMock)

    expect(result).toBe('Your Function has been updated')
  })

  it('should correctly parse complex JSON args', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const complexArgs = {
      nested: {
        array: [1, 2, 3],
        object: {
          key: 'value'
        }
      }
    }

    const functionWithComplexArgs = {
      ...fixtures.functionMock,
      args: JSON.stringify(complexArgs)
    }

    const { sut } = makeSut()
    await sut(functionWithComplexArgs)

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          json_args: complexArgs
        })
      })
    )
  })

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.functionMock)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.functionMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })

  it('should throw error when json_args is invalid JSON', async () => {
    const invalidJsonFunction = {
      ...fixtures.functionMock,
      args: 'invalid json {'
    }

    const { sut } = makeSut()

    await expect(sut(invalidJsonFunction)).rejects.toThrow()
  })
})
