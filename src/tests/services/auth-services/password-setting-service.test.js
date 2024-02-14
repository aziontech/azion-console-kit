import { passwordSettingService } from '@/services/auth-services/password-setting-service'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  payload: {
    password: 'SomeTest123@',
    token: 'uuid123-testuuid123'
  },
  tokenInvalidMessage: 'Your token is expired. Please, request a new one.'
}

const makeSut = () => {
  const sut = passwordSettingService

  return {
    sut
  }
}

describe('AuthServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut(fixtures.payload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/iam/user/password',
      method: 'POST',
      body: fixtures.payload
    })
  })

  it('should throw when token is expired', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { non_field_errors: [fixtures.tokenInvalidMessage] }
    })
    const { sut } = makeSut()

    const request = sut()

    expect(request).rejects.toBe(fixtures.tokenInvalidMessage)
  })

  it.each([
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
