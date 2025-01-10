import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editNetworkListService } from '@/services/network-lists-services/v4'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  networkMock: {
    id: 56782,
    name: 'Az network',
    networkListType: 'ip_cidr',
    itemsValues: '123.123.123.123'
  },
  networkTypeCountryMock: {
    id: 56782,
    itemsValues: '',
    networkListType: 'countries',
    name: 'My New update. dd',
    itemsValuesCountry: ['BR']
  }
}

const makeSut = () => {
  const sut = editNetworkListService

  return {
    sut
  }
}

describe('NetworkListsServicesV4', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.networkMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/workspace/network_lists/${fixtures.networkMock.id}`,
      method: 'PUT',
      body: {
        name: fixtures.networkMock.name,
        type: fixtures.networkMock.networkListType,
        items: [fixtures.networkMock.itemsValues]
      }
    })
  })

  it('should call the API with the correct parameters when the type value is countries', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.networkTypeCountryMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/workspace/network_lists/${fixtures.networkTypeCountryMock.id}`,
      method: 'PUT',
      body: {
        name: fixtures.networkTypeCountryMock.name,
        type: fixtures.networkTypeCountryMock.networkListType,
        items: fixtures.networkTypeCountryMock.itemsValuesCountry
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.networkMock)

    expect(feedbackMessage).toBe('Your network list has been edited')
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
