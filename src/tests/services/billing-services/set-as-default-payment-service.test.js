import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { setAsDefaultPaymentService } from '@/services/billing-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = setAsDefaultPaymentService

  return {
    sut
  }
}

describe('PaymentServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        is_default: true
      }
    })
    const paymentIdMock = 1
    const { sut } = makeSut()
    await sut(paymentIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/payments/credit_cards/${paymentIdMock}`,
      method: 'PATCH',
      body: {
        is_default: true
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        is_default: true
      }
    })
    const paymentIdMock = 1

    const { sut } = makeSut()

    const data = await sut(paymentIdMock)

    expect(data).toStrictEqual('Payment successfully set as default')
  })

  it('Should return an API error for an 400 response status', async () => {
    const errorKey = 'detail'
    const apiErrorMock = 'You can not edit an expired payment method.'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        [errorKey]: [apiErrorMock]
      }
    })

    const paymentIdMock = 1

    const { sut } = makeSut()

    const feedbackMessage = sut(paymentIdMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
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
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const paymentIdMock = 1
      const { sut } = makeSut()

      const response = sut(paymentIdMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
