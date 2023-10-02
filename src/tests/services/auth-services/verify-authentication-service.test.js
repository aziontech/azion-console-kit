import { verifyAuthenticationService } from '@/services/auth-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import {
  InternalServerError,
  InvalidApiRequestError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = verifyAuthenticationService

  return {
    sut
  }
}

describe('AuthServices', () => {
  it('should call token verification service with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'token/verify'
    })
  })

  it('should validate user token on success request', async () => {
    const validUserMock = {
      name: 'John Doe',
      id: '123',
      company: 'ACME'
    }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      body: validUserMock,
      statusCode: 200
    })
    const { sut } = makeSut()

    const response = await sut()

    expect(response).toEqual(validUserMock)
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new InvalidApiRequestError().message
    },
    {
      statusCode: 401,
      expectedError: new InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new UnexpectedError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
        statusCode,
        body: null
      })
      const { sut } = makeSut()

      const response = sut()

      expect(response).rejects.toBe(expectedError)
    }
  )
})
