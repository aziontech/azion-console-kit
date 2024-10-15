import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createNetworkListService } from '@/services/network-lists-services'
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

describe('NetworkListsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.networkMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/network_lists`,
      method: 'POST',
      body: {
        name: fixtures.networkMock.name,
        list_type: fixtures.networkMock.networkListType,
        items_values: fixtures.networkMock.networkContentList
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
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
        results: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.networkMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it('Should return an API error for an 400 error status with a single string error', async () => {
    const apiErrorMock = 'Network name "IP" is already in use on this account'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        error: apiErrorMock
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.networkMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
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

      const response = sut(fixtures.networkMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
