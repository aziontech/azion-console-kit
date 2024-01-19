import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteFunctionService } from '@/services/edge-firewall-functions-services/delete-function-service'
import { describe, expect, it, vi } from 'vitest'

const mocks = {
  functionID: 123,
  edgeApplicationID: 12221
}
const makeSut = () => {
  const sut = deleteFunctionService

  return {
    sut
  }
}

describe('EdgeFirewallFunctionsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const { sut } = makeSut()
    sut(mocks.functionID, mocks.edgeApplicationID)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_firewall/${mocks.edgeApplicationID}/functions_instances/${mocks.functionID}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const { sut } = makeSut()

    const feedbackMessage = await sut(mocks.functionID, mocks.edgeApplicationID)

    expect(feedbackMessage).toBe('Function successfully deleted')
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

      const response = sut(mocks.functionID, mocks.edgeApplicationID)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
