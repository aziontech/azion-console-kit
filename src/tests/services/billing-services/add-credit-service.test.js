import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { addCreditService } from '@/services/billing-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = addCreditService

  return {
    sut
  }
}

describe('BillingServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        amount: 100
      }
    })
    const { sut } = makeSut()
    await sut({ amount: 100 })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/payments/credits`,
      method: 'POST',
      body: {
        amount: 100
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        amount: 100
      }
    })

    const { sut } = makeSut()

    const data = await sut({ amount: 100 })

    expect(data).toStrictEqual('Credit added successfully.')
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

    const { sut } = makeSut()

    const feedbackMessage = sut({ amount: 100 })

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

      const { sut } = makeSut()

      const response = sut({ amount: 100 })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
