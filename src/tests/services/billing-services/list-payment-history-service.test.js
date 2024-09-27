import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listPaymentHistoryService } from '@/services/billing-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'
import { getStaticUrlsByEnvironment } from '@/helpers'

const fixtures = {
  paymentMockIsDefault: {
    amount_with_currency: 'BRL 19,904.73',
    card_brand: 'visa',
    invoice_number: '*--*-0001a062024',
    invoice_url: '/account/6/invoice?billing_month=2024-06',
    payment_due: '2024-07-01',
    payment_method_details: 'Ending in 4242',
    status: 'Paid'
  }
}

const makeSut = () => {
  const sut = listPaymentHistoryService

  return {
    sut
  }
}

describe('BillingServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/payments/history?page_size=200`,
      method: 'GET'
    })
  })

  it('should parse correctly all returned payment history', async () => {
    localeMock()
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.paymentMockIsDefault] }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        amount: 'BRL 19,904.73',
        invoiceNumber: {
          content: '*--*-0001a062024'
        },
        paymentMethod: {
          cardNumber: 'Ending in 4242',
          cardBrand: 'visa',
          value: 'visa Ending in 4242'
        },
        invoiceUrl: `${getStaticUrlsByEnvironment(
          'manager'
        )}/account/6/invoice?billing_month=2024-06`,
        status: {
          content: 'Paid',
          icon: 'pi pi-check-circle',
          severity: 'success'
        },
        paymentDate: '07/01/2024'
      }
    ])
  })
})
