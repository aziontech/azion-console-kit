import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listPaymentHistoryService } from '@/services/billing-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'
import { getStaticUrlsByEnvironment } from '@/helpers'
import { useAccountStore } from '@/stores/account'
import graphQLApi from '@/services/axios/makeGraphQl'

const fixtures = {
  paymentMockIsDefault: {
    amount_with_currency: 'BRL 19,904.73',
    card_brand: 'visa',
    invoice_number: '*--*-0001a062024',
    invoice_url: '/account/6/invoice?billing_month=2024-06',
    payment_due: '2024-07-01',
    payment_method_details: 'Ending in 4242',
    status: 'Paid'
  },
  accountingDetailMock: {
    billId: 'BILL-123',
    periodTo: '2024-07-01',
    accounted: true,
    invoiceNumber: 'INV-123',
    regionName: 'US',
    productSlug: 'product-1',
    metricSlug: 'metric-1'
  }
}

const getLastDayMonth = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const dateFinal = new Date(year, month + 1, 0)

  return dateFinal.toISOString().split('T')[0]
}

const makeSut = () => {
  const sut = listPaymentHistoryService

  return {
    sut
  }
}

vi.mock('@/stores/account')
describe('BillingServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useAccountStore.mockReturnValue({
      accountIsNotRegular: true
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
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

  it('should call correct endpoint when account is not regular', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/payments/history?page_size=200',
      method: 'GET'
    })
  })

  it('should call correct endpoint when account is regular', async () => {
    useAccountStore.mockReturnValue({
      accountIsNotRegular: false
    })

    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { accountingDetail: [] } }
    })

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'accounting',
      method: 'POST',
      body: {
        query: `
        query {
          accountingDetail (
            filter: {
              periodToLt: "${getLastDayMonth()}"
            },
            limit: 12,
            groupBy: [billId],
            orderBy: [periodTo_DESC]
          ) {
            billId,
            periodTo,
            accounted,
            invoiceNumber,
            regionName,
            productSlug,
            metricSlug
          }
        }`
      }
    }, graphQLApi)
  })

  it('should parse correctly payment history for regular accounts', async () => {
    useAccountStore.mockReturnValue({
      accountIsNotRegular: false
    })

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { accountingDetail: [fixtures.accountingDetailMock] } }
    })

    const { sut } = makeSut()
    const result = await sut()

    expect(result).toEqual([
      {
        invoiceNumber: {
          content: 'BILL-123'
        },
        invoiceUrl: null,
        paymentDate: '07/01/2024'
      }
    ])
  })

  it('should handle different payment status correctly', async () => {
    const pendingPayment = { ...fixtures.paymentMockIsDefault, status: 'Pending' }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [pendingPayment] }
    })

    const { sut } = makeSut()
    const result = await sut()

    expect(result[0].status).toEqual({
      content: 'Pending',
      icon: 'pi pi-calendar',
      severity: 'danger'
    })
  })
})
