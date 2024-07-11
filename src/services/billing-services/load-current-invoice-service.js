import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeBillingBaseUrl } from './make-billing-base-url'

export const loadBillingCurrentInvoiceService = async () => {
  const dateRange = getCurrentMonthStartEnd()
  const payload = {
    query: `query getBillDetail {
      billDetail(
          aggregate: { sum: value }
          groupBy: [billId]
          orderBy: [productSlug_ASC, metricSlug_ASC]
          filter: {
              createdDateRange: {
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
          currency
      }
    }`
  }

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeBillingBaseUrl()}`,
    method: 'POST',
    body: payload
  }, graphQLApi)

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parseInvoice = httpResponse.body.data?.billDetail.map((invoice) => {
    return {
      total: invoice.totalValue,
      currency: invoice.currency,
      billingPeriod: `${formatPeriod(invoice.periodFrom)} - ${formatPeriod(invoice.periodTo)}`,
      productChanges: '-',
      servicePlan: '-',
      creditUsedForPayment: 0.00
    }
  })
  return {
    body: parseInvoice || [],
    statusCode: httpResponse.statusCode
  }
}

const formatPeriod = (period) => {
  return period.split('-').reverse().join('/')
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
