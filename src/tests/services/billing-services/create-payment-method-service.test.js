import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import {
  InternalServerError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from '@/services/axios/errors'
import { createPaymentMethodService } from '@/services/billing-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  payload: {
    card_address_zip: '12345678',
    card_country: 'Brazil',
    stripe_token: 'pk_test',
    card_id: 'card_test',
    card_brand: 'visa',
    card_holder: 'Jhon Doe',
    card_last_4_digits: '4242',
    card_expiration_month: '2',
    card_expiration_year: '2028'
  }
}

const makeSut = () => {
  const sut = createPaymentMethodService
  return {
    sut
  }
}

describe('DigitalCertificatesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.payload)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${version}/payments/credit_cards`,
      body: fixtures.payload
    })
  })

  it('should return a feedback when successfully create an payment method', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })

    const { sut } = makeSut()
    const result = await sut(fixtures.payload)

    expect(result).toEqual({
      feedback: 'Your Credit Card has been added'
    })
  })

  it('should throw when request fails with statusCode 400', async () => {
    const apiErrorMock = {
      error: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.payload)

    expect(apiErrorResponse).rejects.toBe('error: api error message')
  })

  it.each([
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
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: fixtures.errorMock
      })
      const { sut } = makeSut()

      const response = sut(fixtures.csrCertificateMock)
      expect(response).rejects.toThrow(expectedError)
    }
  )
})
