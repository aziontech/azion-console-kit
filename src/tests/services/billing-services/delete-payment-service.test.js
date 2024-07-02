import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deletePaymentService } from '@/services/billing-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deletePaymentService

  return {
    sut
  }
}

describe('BillingServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const paymentIdMock = 1

    const { sut } = makeSut()
    await sut(paymentIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/v4/payments/credit_cards/${paymentIdMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const paymentIdMock = 2
    const { sut } = makeSut()

    const feedbackMessage = await sut(paymentIdMock)

    expect(feedbackMessage).toBe('Payment successfully deleted')
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.NotFoundError().message
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
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      const paymentIdMock = 3
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(paymentIdMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
