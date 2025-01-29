import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createNetworkListService } from '@/services/network-lists-services/v4'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  networkMock: {
    name: 'AZ network',
    networkListType: 'ip_cidr',
    networkContentList: '123.123.123.123'
  }
}

const makeSut = () => {
  const sut = createNetworkListService

  return {
    sut
  }
}

describe('NetworkListsServicesV4', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.networkMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/workspace/network_lists`,
      method: 'POST',
      body: {
        name: fixtures.networkMock.name,
        type: fixtures.networkMock.networkListType,
        items: fixtures.networkMock.networkContentList
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.networkMock)

    expect(data.feedback).toBe('Your network list has been created')
  })

  it('Should return an API error for an 400 error status with a array of errors', async () => {
    const apiErrorMock = 'Network name "IP" is already in use on this account'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        data: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.networkMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
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

    const apiErrorResponse = sut(fixtures.networkMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
