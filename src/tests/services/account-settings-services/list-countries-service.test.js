import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { listCountriesService } from '@/services/account-settings-services'
import graphQLApi from '@services/axios/makeGraphQl'

const fixtures = {
  mockResponse: {
    data: {
      allCountries: [{ name: 'Brazil', geonameId: '1234' }]
    }
  },
  formattedResponse: [{ name: 'Brazil', geonameId: '1234' }],
  mockError: [{ message: 'Error' }]
}

const makeSut = () => {
  const sut = listCountriesService

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
      query: 'query allCountries { allCountries { name, geonameId } }'
    }

    const { sut } = makeSut()

    await sut()

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

    const result = await sut()

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
          errors: fixtures.mockError
        }
      })
      const { sut } = makeSut()

      const request = sut()

      expect(request).rejects.toBe(expectedError)
    }
  )
})
