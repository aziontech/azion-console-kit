import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editNetworkListService } from '@/services/network-lists-services/v4/edit-network-list-service'
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
  return { sut }
}

describe('NetworkListsServices V4', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    await sut(fixtures.networkMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/workspace/network_lists/${fixtures.networkMock.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.networkMock.name,
        type: fixtures.networkMock.networkListType,
        items: [fixtures.networkMock.itemsValues]
      }
    })
  })

  it('should call the API with the correct parameters when the type value is countries', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    await sut(fixtures.networkTypeCountryMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/workspace/network_lists/${fixtures.networkTypeCountryMock.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.networkTypeCountryMock.name,
        type: fixtures.networkTypeCountryMock.networkListType,
        items: fixtures.networkTypeCountryMock.itemsValuesCountry
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.networkMock)

    expect(feedbackMessage).toBe('Your Network List has been updated')
  })

  it('should throw when request fails with API error', async () => {
    const apiErrorMock = 'Network name "IP" is already in use on this account'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        detail: apiErrorMock
      }
    })
    const { sut } = makeSut()

    const promise = sut(fixtures.networkMock)

    await expect(promise).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const promise = sut(fixtures.networkMock)

      await expect(promise).rejects.toBe(expectedError)
    }
  )
})
