import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listCountriesService } from '@/services/network-lists-services'
import graphQLApi from '@/services/axios/makeGraphQl'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  BrazilMock: {
    name: 'Brazil',
    code2: '55'
  },
  EuaMock: {
    name: 'United States',
    code2: 1
  }
}

const makeSut = () => {
  const sut = listCountriesService

  return {
    sut
  }
}

describe('NetworkListsServices', () => {
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
        url: `graphql/`,
        method: 'POST',
        body: {
          query: 'query all_countries_with_code {allCountries { name, code2 } }'
        }
      },
      graphQLApi
    )
  })

  it('should parsed correctly each dns record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          allCountries: [fixtures.BrazilMock, fixtures.EuaMock]
        }
      }
    })
    const { sut } = makeSut()

    const domains = await sut()

    expect(domains).toEqual([
      {
        name: fixtures.BrazilMock.name,
        value: fixtures.BrazilMock.code2
      },
      {
        name: fixtures.EuaMock.name,
        value: fixtures.EuaMock.code2
      }
    ])
  })
})
