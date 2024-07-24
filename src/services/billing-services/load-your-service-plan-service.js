import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { formatDateToUSBilling } from '@/helpers/convert-date'

export const loadYourServicePlanService = async (disclaimer = '') => {
  const { lastDayOfMonth, firstDayOfMonth } = getFirstDayCurrentDate()

  const payload = {
    query: `query getBillDetail {
        payments: paymentsClientDebt(
              limit: 1,
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

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `/billing`,
      method: 'POST',
      body: payload
    },
    graphQLApi
  )

  httpResponse = adapt(httpResponse, disclaimer)

  return parseHttpResponse(httpResponse)
}

function extractPriceFromString(sentence) {
  const regex = /USD (\d+\.\d+)/
  const match = sentence.match(regex)

  return match ? match[1] : '0.00'
}

const adapt = (httpResponse, disclaimer) => {
  const {
    body: { data },
    statusCode
  } = httpResponse

  const defaultPayment = {
    paymentDate: '---',
    amount: '---',
    currency: '---'
  }

  const yourServicePlan = data?.payments[0] || defaultPayment

  const parseYourServicePlan = {
    paymentDate: formatDateToUSBilling(yourServicePlan.paymentDate),
    amount: yourServicePlan.amount,
    currency: yourServicePlan.currency,
    creditBalance: extractPriceFromString(disclaimer)
  }

  return {
    body: parseYourServicePlan,
    statusCode
  }
}

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
