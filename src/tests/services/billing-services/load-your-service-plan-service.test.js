import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadYourServicePlanService } from '@/services/billing-services'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import graphQLApi from '@/services/axios/makeEventsApi'
import { useAccountStore } from '@/stores/account'
import { createPinia } from 'pinia'
import { loadContractServicePlan } from '@/services/contract-services'

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
  accountDataDeveloperPlan: {
    name: 'Paulo Sobrinho',
    full_name: 'Paulo Sobrinho Ferreira',
    disclaimer:
      "Welcome to your trial period. You have USD 300.00 to use in 71 days. To use Azion with no service interruptions at the end of your trial, add a payment method <a href='/billing-subscriptions/payment-methods/add' target='_top'>right here</a>.",
    status: 'TRIAL',
    client_id: '8048e',
    user_id: 3652
  },
  accountDataBusinessPlan: {
    name: 'Paulo Sobrinho',
    full_name: 'Paulo Sobrinho Ferreira',
    disclaimer:
      "Welcome to your trial period. You have USD 23.02 to use in 71 days. To use Azion with no service interruptions at the end of your trial, add a payment method <a href='/billing-subscriptions/payment-methods/add' target='_top'>right here</a>.",
    status: 'BUSINESS',
    client_id: '8048e',
    user_id: 3652
  },
  accountDataWithoutCreditBalance: {
    name: 'Paulo Sobrinho',
    full_name: 'Paulo Sobrinho Ferreira',
    disclaimer:
      "Welcome to your trial period. You have USD to use in 71 days. To use Azion with no service interruptions at the end of your trial, add a payment method <a href='/billing-subscriptions/payment-methods/add' target='_top'>right here</a>.",
    status: 'BUSINESS',
    client_id: '8048e',
    user_id: 3652
  }
}

const makeSut = () => {
  const sut = loadYourServicePlanService

  return { sut }
}
vi.mock('@/stores/account')
vi.mock('@/services/contract-services')

describe('BillingService', () => {
  beforeEach(() => {
    createPinia()
  })

  it('should call api with correct params', async () => {
    useAccountStore.mockReturnValue({
      accountData: fixtures.accountDataDeveloperPlan
    })
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          payments: [fixtures.paymentMock]
        }
      }
    })

    loadContractServicePlan.mockReturnValue({
      isDeveloperSupportPlan: true,
      yourServicePlan: 'Developer'
    })

    const { sut } = makeSut()
    const token = 'token'
    const apiClient = graphQLApi(token)
    await sut(apiClient)
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
    expect(requestSpy).not.toHaveBeenCalledWith(
      {
        url: '/billing',
        method: 'POST',
        body: payload
      },
      apiClient
    )
  })

  it('should parse correctly each returned item servicePlan "Developer"', async () => {
    useAccountStore.mockReturnValue({
      accountData: fixtures.accountDataDeveloperPlan
    })
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { payments: [fixtures.paymentMock] } }
    })
    const { sut } = makeSut()
    const result = await sut({})

    expect(result).toEqual({
      amount: 0,
      cardBrand: 'visa',
      cardLast4Digits: '4123',
      creditBalance: '300.00',
      currency: 'USD',
      isTrial: true,
      paymentDate: '07/01/2024',
      servicePlan: 'Developer'
    })
  })

  it('should parse correctly each returned item servicePlan "Business"', async () => {
    useAccountStore.mockReturnValue({
      accountData: fixtures.accountDataBusinessPlan
    })
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { payments: [fixtures.paymentMock] } }
    })

    loadContractServicePlan.mockReturnValue({
      isDeveloperSupportPlan: true,
      yourServicePlan: 'Business'
    })
    const { sut } = makeSut()
    const result = await sut({})

    expect(result).toEqual({
      amount: 0,
      cardBrand: 'visa',
      cardLast4Digits: '4123',
      creditBalance: '23.02',
      currency: 'USD',
      isTrial: false,
      paymentDate: '07/01/2024',
      servicePlan: 'Business'
    })
  })

  it('should return 0.00 when it do not find a value in the disclaimer ', async () => {
    useAccountStore.mockReturnValue({
      accountData: fixtures.accountDataWithoutCreditBalance
    })
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { payments: [fixtures.paymentMock] } }
    })

    loadContractServicePlan.mockReturnValue({
      isDeveloperSupportPlan: true,
      yourServicePlan: 'Business'
    })
    const { sut } = makeSut()
    const result = await sut({})

    expect(result).toEqual({
      amount: 0,
      cardBrand: 'visa',
      cardLast4Digits: '4123',
      creditBalance: '0.00',
      currency: 'USD',
      isTrial: false,
      paymentDate: '07/01/2024',
      servicePlan: 'Business'
    })
  })
})
