import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { patchFullnameService } from '@/services/signup-services/patch-fullname-service'

const fixtures = {
  basePayloadMock: {
    id: 1234,
    name: 'Joaquin José da Silva Xavier'
  },
  basePayloadMockWithoutLastName: {
    id: 1234,
    name: 'Joaquin'
  },
  formattedNameWithoutLast: {
    first_name: 'Joaquin'
  },
  formattedNameWithFirstAndLast: {
    first_name: 'Joaquin',
    last_name: 'José da Silva Xavier'
  }
}

const makeSut = () => {
  const sut = patchFullnameService

  return {
    sut
  }
}

describe('SignupServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {}
    })

    const version = 'v4'

    const { sut } = makeSut()

    await sut(fixtures.basePayloadMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/users/${fixtures.basePayloadMock.id}`,
      method: 'PATCH',
      body: fixtures.formattedNameWithFirstAndLast
    })
  })

  it('should parse the name correctly', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {}
    })

    const version = 'v4'

    const { sut } = makeSut()

    await sut(fixtures.basePayloadMockWithoutLastName)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/users/${fixtures.basePayloadMock.id}`,
      method: 'PATCH',
      body: fixtures.formattedNameWithoutLast
    })
  })

  it('should return null on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {}
    })

    const { sut } = makeSut()

    const result = await sut(fixtures.basePayloadMock)

    expect(result).toBeNull()
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Error(
        JSON.stringify({
          errorMessage: new Errors.InvalidApiRequestError().message,
          errorType: 'field',
          fieldName: 'name'
        })
      )
    },
    {
      statusCode: 403,
      expectedError: new Error(
        JSON.stringify({
          errorMessage: new Errors.PermissionError().message,
          errorType: 'api',
          fieldName: null
        })
      )
    },
    {
      statusCode: 404,
      expectedError: new Error(
        JSON.stringify({
          errorMessage: new Errors.NotFoundError().message,
          errorType: 'api',
          fieldName: null
        })
      )
    },
    {
      statusCode: 500,
      expectedError: new Error(
        JSON.stringify({
          errorMessage: new Errors.InternalServerError().message,
          errorType: 'api',
          fieldName: null
        })
      )
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Error(
        JSON.stringify({
          errorMessage: new Errors.UnexpectedError().message,
          errorType: 'api',
          fieldName: null
        })
      )
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const request = sut(fixtures.basePayloadMock)

      expect(request).rejects.toBe(expectedError.message)
    }
  )
})
