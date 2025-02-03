import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeFunctionsService } from '@/services/edge-functions-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFunctionMock: {
    name: 'mockFunction',
    code: 'function test() { return true }',
    language: 'javascript',
    initiatorType: 'request',
    args: JSON.stringify({ key: 'value' }),
    active: true
  }
}

const makeSut = () => {
  const sut = createEdgeFunctionsService
  return { sut }
}

describe('EdgeFunctionsService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        data: {
          id: '123456'
        }
      }
    })
    const { sut } = makeSut()

    await sut(fixtures.edgeFunctionMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: expect.any(String),
      method: 'POST',
      body: {
        name: fixtures.edgeFunctionMock.name,
        code: fixtures.edgeFunctionMock.code,
        language: fixtures.edgeFunctionMock.language,
        initiator_type: fixtures.edgeFunctionMock.initiatorType,
        json_args: { key: 'value' },
        active: fixtures.edgeFunctionMock.active
      }
    })
  })

  it('should return feedback and URLs when successfully creating an edge function', async () => {
    const functionId = '123456'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        data: {
          id: functionId
        }
      }
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.edgeFunctionMock)

    expect(result).toEqual({
      feedback: 'Your edge function has been created',
      urlToEditView: `/edge-functions/edit/${functionId}`,
      functionId: functionId
    })
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: {
        detail: 'Internal server error'
      }
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.edgeFunctionMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
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

    const apiErrorResponse = sut(fixtures.edgeFunctionMock)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })
})
