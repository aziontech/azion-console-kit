import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { formatDateToUSBilling } from '@/helpers/convert-date'

export const loadYourServicePlanService = async (disclaimer = '') => {
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

  if (match && match[1]) {
    return match[1]
  } else {
    return '0.00'
  }
}

const adapt = (httpResponse, disclaimer) => {
  const [yourServicePlan] = httpResponse.body.data.payments

  const parseYourServicePlan = {
    paymentDate: formatDateToUSBilling(yourServicePlan.paymentDate),
    amount: yourServicePlan.amount,
    currency: yourServicePlan.currency,
    cardBrand: yourServicePlan.cardBrand.toLowerCase(),
    cardLast4Digits: yourServicePlan.cardLast4Digits,
    creditBalance: extractPriceFromString(disclaimer)
  }

  return {
    body: parseYourServicePlan,
    statusCode: httpResponse.statusCode
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
