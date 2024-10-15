import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editFunctionService } from '@/services/edge-firewall-functions-services'
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

describe('EdgeFirewallFunctionsServices', () => {
  it('should call API with correct params and parse args as JSON', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut(fixtures.functionPayload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_firewall/${fixtures.functionPayload.edgeFirewallID}/functions_instances/${fixtures.functionPayload.id}`,
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
      statusCode: 200,
      body: {}
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.functionPayload)

    expect(data).toBe('Your Function has been updated')
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

      const response = sut(fixtures.functionPayload)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
