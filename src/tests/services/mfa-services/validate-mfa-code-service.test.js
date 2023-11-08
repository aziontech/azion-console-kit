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

describe('GenerateQrcodeMfaService', () => {
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

  it('should validate if code not exist', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { detail: 'The inputted code is incorrect.' }
    })
    const { sut } = makeSut()
    const expectedError = new Error('The inputted code is incorrect.')

    try {
      await sut(fixtures.mfaToken)
    } catch (error) {
      expect(error.message).toBe(expectedError.message)
    }
  });

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError()
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError()
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError()
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError()
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError()
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: { results: [] }
      })
      const { sut } = makeSut()

      try {
        await sut(fixtures.mfaToken)
      } catch (error) {
        expect(error.message).toBe(expectedError.message)
      }
    }
  )
})
