import { switchAccountService } from '@/services/auth-services'
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
  const sut = switchAccountService

  return {
    sut
  }
}

describe.concurrent('AuthServices', () => {
  it('should call switch account service with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      body: {},
      statusCode: 200
    })
    const accountIdMock = 332211
    const { sut } = makeSut()

    await sut(accountIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `switch-account/${accountIdMock}`
    })
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
        body: {}
      })
      const accountIdStub = 332211
      const { sut } = makeSut()

      const response = sut(accountIdStub)

      expect(response).rejects.toThrow(expectedError)
    }
  )
})
