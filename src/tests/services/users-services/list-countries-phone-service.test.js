import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listCountriesPhoneService } from '@/services/users-services'
import graphQLApi from '@/services/axios/makeGraphQl'
import { describe, expect, it, vi } from 'vitest'
import { InvalidDataStructureError } from '@/services/axios/errors'

const fixtures = {
  countriesMock: [
    {
      name: 'Afghanistan',
      code2: 'AF',
      phone: '93'
    },
    {
      name: 'Aland Islands',
      code2: 'AX',
      phone: '358-18'
    }
  ]
}

const makeSut = () => {
  const sut = listCountriesPhoneService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          allCountries: []
        }
      }
    })

    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith(
      {
        url: `cities/`,
        method: 'POST',
        body: {
          query: 'query allCountries {allCountries { name, code2, phone } }'
        }
      },
      graphQLApi
    )
  })

  it('should parsed correctly each countries', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          allCountries: fixtures.countriesMock
        }
      }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        label: 'AF (Afghanistan) +93',
        labelFormat: 'AF +93',
        value: 'AF - 93'
      },
      {
        label: 'AX (Aland Islands) +358-18',
        labelFormat: 'AX +358-18',
        value: 'AX - 358-18'
      }
    ])
  })
  it('should throw if response body is not an array', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: undefined
    })
    const { sut } = makeSut()

    const response = sut()

    expect(response).rejects.toThrow(new InvalidDataStructureError().message)
  })
})
