import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editFunctionService } from '@/services/edge-firewall-functions-services/v4'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  functionPayload: {
    id: 12,
    edgeFirewallID: '2321',
    edgeFunctionID: '1234',
    name: 'teste',
    args: '{"key":"value"}'
  }
}

const makeSut = () => {
  const sut = editFunctionService

  return {
    sut
  }
}

describe('EdgeFirewallFunctionsServicesV4', () => {
  it('should call API with correct params and parse args as JSON', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()

    await sut(fixtures.functionPayload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_firewall/firewalls/${fixtures.functionPayload.edgeFirewallID}/functions/${fixtures.functionPayload.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.functionPayload.name,
        edge_function: fixtures.functionPayload.edgeFunctionID,
        json_args: JSON.parse(fixtures.functionPayload.args)
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {}
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.functionPayload)

    expect(data).toBe('Your Function has been updated')
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

    const apiErrorResponse = sut(fixtures.functionPayload)

    await expect(apiErrorResponse).rejects.toThrow('error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: { data: { id: '123' } }
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.functionPayload)
    const expectedError = new Errors.InternalServerError().message

    await expect(apiErrorResponse).rejects.toThrow(expectedError)
  })
})
