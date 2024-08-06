import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadYourServicePlanService } from '@/services/billing-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import graphQLApi from '@/services/axios/makeGraphQl'

const fixtures = {
  paymentMock: {
    amount: 0,
    cardBrand: 'Visa',
    cardLast4Digits: '4123',
    currency: 'USD',
    paymentDate: '2024-07-01'
  },
  disclaimerWithCustomAmount:
    "Welcome to the Free Trial period. The credit of USD 23.40 is available for use over the next 71 days. To use Azion with no service interruptions at the end of the trial, add a <a href='/billing-subscriptions/payment-methods/add' target='_top'>payment method</a>.",
  disclaimerZero:
    "Welcome to the Free Trial period. The credit of USD is available for use over the next 71 days. To use Azion with no service interruptions at the end of the trial, add a <a href='/billing-subscriptions/payment-methods/add' target='_top'>payment method</a>.",
  disclaimerDefault:
    "Welcome to the Free Trial period. The credit of USD 300.00 is available for use over the next 71 days. To use Azion with no service interruptions at the end of the trial, add a <a href='/billing-subscriptions/payment-methods/add' target='_top'>payment method</a>."
}

const makeSut = () => {
  const sut = loadYourServicePlanService

  return { sut }
}
describe('BillingService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  it('should call api with correct params', async () => {
    const januaryFirst2024Mock = new Date(2024, 0, 1)
    vi.setSystemTime(januaryFirst2024Mock)
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          payments: [fixtures.paymentMock]
        }
      }
    })

    const { sut } = makeSut()

    await sut(fixtures.disclaimerDefault)

    const payload = {
      query: `query getBillDetail {
        payments: paymentsClientDebt(
          limit: 1,
          filter: {
            paymentDateRange: {
                begin: "2024-01-01", end: "2024-01-31"
            },
        },
        orderBy: [paymentDate_ASC]
        )	{
          paymentDate
          amount
          currency
          cardBrand
          cardLast4Digits
        }
      }`
    }
    expect(requestSpy).toHaveBeenCalledWith(
      {
        url: '/billing',
        method: 'POST',
        body: payload
      },
      graphQLApi
    )
  })
  it('should return correct credit amount in the disclaimer message', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { payments: [fixtures.paymentMock] } }
    })

    const { sut } = makeSut()
    const result = await sut(fixtures.disclaimerWithCustomAmount)

    expect(result).toEqual({
      amount: 0,
      creditBalance: '23.40',
      currency: 'USD',
      paymentDate: '07/01/2024'
    })
  })

  it('should return correct response when no payments are found', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { payments: [] } }
    })

    const { sut } = makeSut()
    const result = await sut(fixtures.disclaimerZero)

    expect(result).toEqual({
      amount: '---',
      creditBalance: '0.00',
      currency: '---',
      paymentDate: '---'
    })
  })
})
