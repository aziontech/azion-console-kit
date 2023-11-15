import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { listCountriesService } from '@/services/signup-services'
import graphQLApi from '@services/axios/makeGraphQl'

const citiesMockResponse = {
  data: {
    allCountries: [
      {
        name: 'Afghanistan',
        id: '1'
      }
    ]
  }
}

const makeSut = () => {
  const sut = listCountriesService

  return {
    sut
  }
}

describe('ListCountriesService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: citiesMockResponse
    })
    const { sut } = makeSut()

    await sut()

    const payload = {
      query: `query all_countries_with_code {
      allCountries { name, id },
    }`
    }

    expect(requestSpy).toHaveBeenCalledWith(
      {
        url: 'cities/',
        method: 'POST',
        body: payload
      },
      graphQLApi
    )
  })

  it('should return correct data on success', async () => {
    const mockResponse = {
      statusCode: 200,
      body: citiesMockResponse
    }

    const formattedMockResponse = {
      countries: [
        {
          name: 'Afghanistan',
          id: '1'
        }
      ],
      statusCode: 200
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(mockResponse)
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual(formattedMockResponse)
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
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

      const request = sut()

      expect(request).rejects.toBe(expectedError)
    }
  )
})
