import { describe, expect, it, vi } from 'vitest'
import { loadCurrentInvoiceService } from '@/services/billing-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  mockResponse: {
    data: {
      billDetail: [
        {
          billId: 2707388,
          billDetailId: 170072532,
          totalValue: '0.00',
          createdDate: '2024-07-01',
          periodFrom: '2024-07-01',
          periodTo: '2024-07-31',
          invoiceNumber: 'USALLC-4697w052024',
          currency: 'BRL',
          temporaryBill: true
        }
      ]
    }
  },
  formattedResponse: {
    billId: 2707388,
    billingPeriod: '07/01/2024 - 07/31/2024',
    creditUsedForPayment: 0,
    currency: 'BRL',
    productChanges: '---',
    servicePlan: '---',
    total: '0.00',
    temporaryBill: true
  },
  mockError: [{ message: 'Error' }]
}

const makeSut = () => {
  const sut = loadCurrentInvoiceService

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

  it('should return correct response for empty data', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { billDetail: [] } }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual({
      billId: '---',
      billingPeriod: '---',
      creditUsedForPayment: 0,
      currency: '---',
      productChanges: '---',
      servicePlan: '---',
      temporaryBill: '---',
      total: '---'
    })
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
          data: { billDetail: [] }
        }
      })
      const { sut } = makeSut()

      const request = sut()

      expect(request).rejects.toBe(expectedError)
    }
  )
})
