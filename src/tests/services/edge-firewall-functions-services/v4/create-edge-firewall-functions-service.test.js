import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createFunctionService } from '@/services/edge-firewall-functions-services/v4'
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

describe('EdgeFirewallFunctionsServicesV4', () => {
  it('should call API with correct params and parse args as JSON', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      statusCode: 202,
      body: {
        data: {
          id: 'funcInstance123'
        }
      }
    })
    const { sut } = makeSut()

    await sut(fixtures.functionMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_firewall/firewalls/${fixtures.functionMock.id}/functions`,
      method: 'POST',
      body: {
        name: fixtures.functionMock.name,
        edge_function: fixtures.functionMock.edgeFunctionID,
        json_args: JSON.parse(fixtures.functionMock.args)
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

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.functionMock)

    await expect(apiErrorResponse).rejects.toThrow('error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: { data: { id: '123' } }
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.functionMock)
    const expectedError = new Errors.InternalServerError().message

    await expect(apiErrorResponse).rejects.toThrow(expectedError)
  })
})
