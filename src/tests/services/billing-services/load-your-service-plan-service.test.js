import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadYourServicePlanService } from '@/services/billing-services'
import { describe, expect, it, vi } from 'vitest'
import graphQLApi from '@/services/axios/makeGraphQl'
import { formatDateToUSBilling } from '@/helpers/convert-date'

const getFirstDayCurrentDate = () => {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  return {
    firstDayOfMonth: formatDate(firstDayOfMonth),
    lastDayOfMonth: formatDate(lastDayOfMonth)
  }
}

const fixtures = {
  paymentMock: {
    amount: 0,
    cardBrand: 'Visa',
    cardLast4Digits: '4123',
    currency: 'USD',
    paymentDate: '2024-07-01'
  },
  disclaimerTwentyThree:
    "Welcome to the Free Trial period. The credit of USD 23.40 is available for use over the next 71 days. To use Azion with no service interruptions at the end of the trial, add a <a href='/billing-subscriptions/payment-methods/add' target='_top'>payment method</a>.",
  disclaimerZero:
    "Welcome to the Free Trial period. The credit of USD  is available for use over the next 71 days. To use Azion with no service interruptions at the end of the trial, add a <a href='/billing-subscriptions/payment-methods/add' target='_top'>payment method</a>.",
  disclaimerDefault:
    "Welcome to the Free Trial period. The credit of USD 300.00 is available for use over the next 71 days. To use Azion with no service interruptions at the end of the trial, add a <a href='/billing-subscriptions/payment-methods/add' target='_top'>payment method</a>."
}

const makeSut = () => {
  const sut = loadYourServicePlanService

  return { sut }
}
describe('BillingService', () => {
  it('should call api with correct params', async () => {
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
    const { lastDayOfMonth, firstDayOfMonth } = getFirstDayCurrentDate()

    const payload = {
      query: `query getBillDetail {
        payments: paymentsClientDebt(
              filter: {
                  paymentDateRange: {
                      begin: "${firstDayOfMonth}", end: "${lastDayOfMonth}"
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
  it('should return 23.40 value in the disclaimer ', async () => {
    const { firstDayOfMonth } = getFirstDayCurrentDate()

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { payments: [fixtures.paymentMock] } }
    })

    const { sut } = makeSut()
    const result = await sut(fixtures.disclaimerTwentyThree)

    expect(result).toEqual({
      amount: 0,
      creditBalance: '23.40',
      currency: 'USD',
      paymentDate: formatDateToUSBilling(firstDayOfMonth)
    })
  })

  it('should return 0.00 when it do not find a value in the disclaimer ', async () => {
    const { firstDayOfMonth } = getFirstDayCurrentDate()

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { payments: [fixtures.paymentMock] } }
    })

    const { sut } = makeSut()
    const result = await sut(fixtures.disclaimerZero)

    expect(result).toEqual({
      amount: 0,
      creditBalance: '0.00',
      currency: 'USD',
      paymentDate: formatDateToUSBilling(firstDayOfMonth)
    })
  })
})
