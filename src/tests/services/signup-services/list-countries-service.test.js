import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { listCountriesService } from '@/services/signup-services'
import graphQLApi from '@services/axios/makeGraphQl'

const citiesMockResponse = {
  data: {
    allCountries: [{ name: 'Brazil' }]
  }
}

const formattedMockResponse = [{ name: 'Brazil' }]

const makeSut = () => {
  const sut = listCountriesService

  return {
    sut
  }
}

describe('SignupServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: citiesMockResponse
    })

    const mockPayload = {
      query: `query all_countries_with_code {
      allCountries { name },
    }`
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
      body: citiesMockResponse
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual({
      statusCode: 200,
      countries: formattedMockResponse
    })
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
