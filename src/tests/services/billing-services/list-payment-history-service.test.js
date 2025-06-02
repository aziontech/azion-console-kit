import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listPaymentHistoryService } from '@/services/billing-services/list-payment-history-service'
import { describe, expect, it, vi } from 'vitest'
import { useAccountStore } from '@/stores/account'
import { getLastDayMonth } from '@/helpers/payment-history'

const fixtures = {
  regularAccountResponse: {
    data: {
      accountingDetail: [
        {
          billId: '123',
          periodTo: '2024-03-31',
          accounted: true,
          invoiceNumber: 'INV-123',
          regionName: 'US',
          productSlug: 'edge-application',
          metricSlug: 'requests'
        }
      ]
    }
  },
  nonRegularAccountResponse: {
    results: [
      {
        amount_with_currency: '$100.00',
        invoice_number: 'INV-123',
        card_brand: 'VISA',
        payment_method_details: '****1234',
        status: 'Paid',
        payment_due: '2024-03-31'
      }
    ]
  }
}

const makeSut = () => {
  const sut = listPaymentHistoryService

  return {
    sut
  }
}

describe('BillingServices', () => {
  it('should call API with correct params for regular accounts', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.regularAccountResponse
    })
    vi.spyOn(useAccountStore(), 'accountIsNotRegular', 'get').mockReturnValue(false)
    vi.spyOn({ getLastDayMonth }, 'getLastDayMonth').mockReturnValue('2024-03-31')

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      baseURL: '/',
      method: 'POST',
      url: 'v4/accounting/graphql',
      body: {
        query: expect.stringContaining('accountingDetail'),
        variables: undefined
      }
    })
  })

  it('should call API with correct params for non-regular accounts', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.nonRegularAccountResponse
    })
    vi.spyOn(useAccountStore(), 'accountIsNotRegular', 'get').mockReturnValue(true)

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: 'v4/payments/history?page_size=200'
    })
  })

  it('should parse regular account payment history correctly', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.regularAccountResponse
    })
    vi.spyOn(useAccountStore(), 'accountIsNotRegular', 'get').mockReturnValue(false)

    const { sut } = makeSut()
    const result = await sut()

    expect(result).toEqual([
      {
        invoiceNumber: {
          content: '123'
        },
        disabled: true,
        invoiceUrl: expect.any(String),
        paymentDate: expect.any(String)
      }
    ])
  })

  it('should parse non-regular account payment history correctly', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.nonRegularAccountResponse
    })
    vi.spyOn(useAccountStore(), 'accountIsNotRegular', 'get').mockReturnValue(true)

    const { sut } = makeSut()
    const result = await sut()

    expect(result).toEqual([
      {
        amount: '$100.00',
        invoiceNumber: {
          content: 'INV-123'
        },
        paymentMethod: {
          cardNumber: '****1234',
          cardBrand: 'visa',
          value: 'visa ****1234'
        },
        disabled: false,
        invoiceUrl: expect.any(String),
        status: {
          content: 'Paid',
          icon: 'pi pi-check-circle',
          severity: 'success'
        },
        paymentDate: expect.any(String)
      }
    ])
  })
})
