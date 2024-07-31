import { describe, expect, it, vi } from 'vitest'
import { loadInvoiceLastUpdatedService } from '@/services/billing-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  mockResponse: {
    data: {
      products: [
        {
          last_updated: '2024-07-01'
        }
      ]
    }
  },
  formattedResponse: 'Last Updated: 07/01/2024',
  mockError: [{ message: 'Error' }]
}

const makeSut = () => {
  const sut = loadInvoiceLastUpdatedService

  return {
    sut
  }
}

describe('BillingServices', () => {
  it('should return correct data on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.mockResponse
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual(fixtures.formattedResponse)
  })

  it.each([
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
        statusCode,
        body: {
          errors: [{ message: 'Error' }]
        }
      })
      const { sut } = makeSut()

      const request = sut(fixtures.invoiceId)

      await expect(request).rejects.toBe(expectedError)
    }
  )
})
