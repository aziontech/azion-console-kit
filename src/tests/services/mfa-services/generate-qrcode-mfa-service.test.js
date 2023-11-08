import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { generateQrCodeService } from '@/services/mfa-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@services/axios/errors'

const fixtures = {
  qrCode: {
    url: 'otpauth://totp/Azion%20SSO%teste.teste%2B3%40azion.com?secret=TESTE&algorithm=SHA1&digits=6&period=30&issuer=Azion+SSO'
  }
}

const makeSut = () => {
  const sut = generateQrCodeService

  return {
    sut
  }
}

describe('GenerateQrcodeMfaService', () => {
  it('should call api correctly', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { results: fixtures.qrCode }
    })

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `totp/create`,
      method: 'GET'
    })
  })

  it('should parsed correctly the url returned to QR Code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { url: fixtures.qrCode.url }
    })

    const { sut } = makeSut()
    const result = await sut()

    expect(result).toEqual({
      url: fixtures.qrCode.url,
    })
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
    },
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: { results: [] }
      })
      const { sut } = makeSut()

      const response = sut({})

      expect(response).rejects.toBe(expectedError)
    }
  )
})
