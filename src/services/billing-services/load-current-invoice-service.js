import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeBillingBaseUrl } from './make-billing-base-url'
import { formatDateToUSBilling } from '@/helpers/convert-date'

export const loadCurrentInvoiceService = async () => {
  const dateRange = getCurrentMonthStartEnd()
  const payload = {
    query: `query getBillDetail {
      billDetail(
          limit: 1,
          aggregate: { sum: value }
          groupBy: [billId]
          orderBy: [productSlug_ASC, metricSlug_ASC]
          filter: {
            periodFromRange: {
              begin: "${dateRange.dateInitial}", end: "${dateRange.dateFinal}"
            }
          }
      ) {
          billId,
          billDetailId
          totalValue,
          createdDate,
          periodFrom,
          periodTo,
          invoiceNumber,
          totalValue,
          currency,
          temporaryBill
      }
    }`
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeBillingBaseUrl()}`,
      method: 'POST',
      body: payload
    },
    graphQLApi
  )

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const {
    body: {
      data: { billDetail }
    },
    statusCode
  } = httpResponse

  const invoice = billDetail.length > 0 ? billDetail[0] : {}
  const emptyDefaultValue = '---'
  let billingPeriod = emptyDefaultValue
  if (invoice.periodFrom && invoice.periodTo) {
    billingPeriod = `${formatDateToUSBilling(invoice.periodFrom)} - ${formatDateToUSBilling(
      invoice.periodTo
    )}`
  }

  const parseInvoice = {
    billId: invoice.billId || emptyDefaultValue,
    total: invoice.totalValue || emptyDefaultValue,
    currency: invoice.currency || emptyDefaultValue,
    billingPeriod,
    productChanges: emptyDefaultValue,
    servicePlan: emptyDefaultValue,
    creditUsedForPayment: invoice.creditUsedForPayment || 0.0,
    temporaryBill: invoice.temporaryBill || emptyDefaultValue
  }

  return {
    body: parseInvoice,
    statusCode
  }
}

const getCurrentMonthStartEnd = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const dateInitial = new Date(year, month, 1)
  const dateFinal = new Date(year, month + 1, 0)

  return {
    dateInitial: dateInitial.toISOString().split('T')[0],
    dateFinal: dateFinal.toISOString().split('T')[0]
  }
}
