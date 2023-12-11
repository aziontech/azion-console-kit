import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listTimezonesService } from '@/services/users-services'
import graphQLApi from '@/services/axios/makeGraphQl'
import { describe, expect, it, vi } from 'vitest'
import { InvalidDataStructureError } from '@/services/axios/errors'

const fixtures = {
  response: ['(UTC +00:00) Africa/Abidjan', '(UTC +00:00) Africa/Accra', '(UTC +01:00) GMT'],
  expected: {
    defaultSelected: 'GMT',
    listTimeZones: [
      {
        label: '(UTC +00:00) Africa/Abidjan',
        utc: 0,
        value: 'Africa/Abidjan'
      },
      {
        label: '(UTC +00:00) Africa/Accra',
        utc: 0,
        value: 'Africa/Accra'
      },
      {
        label: '(UTC +01:00) GMT',
        utc: 100,
        value: 'GMT'
      }
    ]
  }
}

const makeSut = () => {
  const sut = listTimezonesService

  return {
    sut
  }
}

describe('UserServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          allTimezones: []
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
          query: 'query alltimezones { allTimezones }'
        }
      },
      graphQLApi
    )
  })

  it('should parsed correctly each timezone', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          allTimezones: fixtures.response
        }
      }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual(fixtures.expected)
  })

  it('should throw when request fails with body undefined', () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: undefined
    })
    const { sut } = makeSut()

    const response = sut()

    expect(response).rejects.toThrow(new InvalidDataStructureError().message)
  })
})
