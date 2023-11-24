import { refreshAuthenticationService } from '@/services/auth-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import {
  InternalServerError,
  InvalidApiRequestError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from '@/services/axios/errors'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = refreshAuthenticationService

  return {
    sut
  }
}

describe('AuthServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call refresh token service with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'token/refresh'
    })
  })

  it('should update the authentication token on success request', async () => {
    const tokenMock = 't0k4n1$32'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      body: tokenMock,
      statusCode: 200
    })
    const { sut } = makeSut()

    const response = await sut()

    expect(response).toBe(tokenMock)
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
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockReturnValue({
        statusCode,
        body: null
      })
      const { sut } = makeSut()

      const response = sut()

      expect(response).rejects.toThrow(expectedError)
    }
  )
})
