import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteFunctionService } from '@/services/edge-firewall-functions-services/v4/delete-function-service'
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

describe('EdgeFirewallFunctionsServicesV4', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()
    sut(mocks.functionID, mocks.edgeApplicationID)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_firewall/firewalls/${mocks.edgeApplicationID}/functions/${mocks.functionID}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()

    const feedbackMessage = await sut(mocks.functionID, mocks.edgeApplicationID)

    expect(feedbackMessage).toBe('Function successfully deleted')
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

    const apiErrorResponse = sut(mocks.functionID, mocks.edgeApplicationID)

    await expect(apiErrorResponse).rejects.toThrow('error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(mocks.functionID, mocks.edgeApplicationID)
    const expectedError = new Errors.InternalServerError().message

    await expect(apiErrorResponse).rejects.toThrow(expectedError)
  })
})
