import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { validateMfaCodeService } from '@/services/mfa-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@services/axios/errors'

const fixtures = {
  mfaToken: '123456'
}

const makeSut = () => {
  const sut = validateMfaCodeService

  return {
    sut
  }
}

describe('MfaServices', () => {
  it('should call api with correct headers', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: null }
    })

    const { sut } = makeSut()
    await sut(fixtures.mfaToken)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `totp/validate`,
      method: 'POST',
      headers: {
        token: fixtures.mfaToken
      }
    })
  })

  it('should return error message to an invalid code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { detail: 'The inputted code is incorrect.' }
    })
    const { sut } = makeSut()
    const expectedError = new Error('The inputted code is incorrect.')

    const response = sut(fixtures.mfaToken)
    expect(response).rejects.toThrow(expectedError.message)
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Error('Your session was expired, please login again.').message
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: { results: [] }
      })
      const { sut } = makeSut()

      const response = sut(fixtures.mfaToken)

      expect(response).rejects.toThrow(expectedError.message)
    }
  )
})
