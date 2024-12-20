import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editEdgeFunctionsService } from '@/services/edge-functions-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFunctionMock: {
    id: '123456',
    name: 'Test Function',
    code: 'function test() { return true; }',
    language: 'javascript',
    initiatorType: 'event',
    args: JSON.stringify({ key: 'value' }),
    active: true
  }
}

const makeSut = () => {
  const sut = editEdgeFunctionsService
  return { sut }
}

describe('EdgeFunctionsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    await sut(fixtures.edgeFunctionMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_functions/functions/${fixtures.edgeFunctionMock.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.edgeFunctionMock.name,
        code: fixtures.edgeFunctionMock.code,
        language: fixtures.edgeFunctionMock.language,
        initiator_type: fixtures.edgeFunctionMock.initiatorType,
        json_args: JSON.parse(fixtures.edgeFunctionMock.args),
        active: fixtures.edgeFunctionMock.active
      }
    })
  })

  it('should return success message when edge function is updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.edgeFunctionMock)

    expect(result).toBe('Your edge function has been updated')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: { detail: 'Internal server error' }
    })

    const { sut } = makeSut()
    const promise = sut(fixtures.edgeFunctionMock)

    await expect(promise).rejects.toBe(new Errors.InternalServerError().message)
  })

  it('should throw API error when request fails with non-500 status code', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()
    const promise = sut(fixtures.edgeFunctionMock)

    await expect(promise).rejects.toBe('api error message')
  })
})
