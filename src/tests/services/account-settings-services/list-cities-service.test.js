import { describe, expect, it, vi } from 'vitest'
import { listCitiesService } from '@/services/account-settings-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import graphQLApi from '@services/axios/makeGraphQl'

const fixtures = {
  mockResponse: {
    data: {
      region: [
        {
          citySet: [{ name: 'City1', geonameId: '5678' }]
        }
      ]
    }
  },
  formattedResponse: [{ name: 'City1', geonameId: '5678' }],
  mockError: [{ message: 'Error' }]
}

const makeSut = () => {
  const sut = listCitiesService

  return {
    sut
  }
}

describe('AccountSettingsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.mockResponse
    })

    const mockPayload = {
      query: `query region { region(geoid: 1234) { citySet { name, geonameId } } }`
    }

    const { sut } = makeSut()

    await sut('1234')

    expect(requestSpy).toHaveBeenCalledWith(
      {
        url: 'cities/',
        method: 'POST',
        body: mockPayload
      },
      graphQLApi
    )
  })

  it('should return correct data on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.mockResponse
    })
    const { sut } = makeSut()

    const result = await sut('1234')

    expect(result).toEqual(fixtures.formattedResponse)
  })

  it.each([
    {
      statusCode: 400,
      expectedError: fixtures.mockError[0].message
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
        statusCode,
        body: {
          errors: [{ message: 'Error' }]
        }
      })
      const { sut } = makeSut()

      const request = sut('1234')

      expect(request).rejects.toBe(expectedError)
    }
  )
})
