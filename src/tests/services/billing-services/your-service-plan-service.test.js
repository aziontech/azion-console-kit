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
    cardLast4Digits: '',
    currency: 'USD',
    paymentDate: '2024-07-01'
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
    useAccountStore.mockReturnValue({
      accountData: {
        name: 'Paulo Sobrinho',
        full_name: 'Paulo Sobrinho Ferreira',
        disclaimer:
          "Welcome to your trial period. You have USD 300.00 to use in 71 days. To use Azion with no service interruptions at the end of your trial, add a payment method <a href='/billing-subscriptions/payment-methods/add' target='_top'>right here</a>.",
        status: 'TRIAL',
        client_id: '8048e',
        user_id: 3652
      }
    })
  })

  it('should call api with correct params', async () => {
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

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { payments: [fixtures.paymentMock] } }
    })
    const { sut } = makeSut()
    const result = await sut({})

    expect(result).toEqual({
      amount: 0,
      cardBrand: 'visa',
      cardLast4Digits: '',
      creditBalance: '300.00',
      currency: 'USD',
      isTrial: true,
      paymentDate: '07/01/2024',
      servicePlan: 'Developer'
    })
  })
})
