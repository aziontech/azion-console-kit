import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeBillingBaseUrl } from './make-billing-base-url'

export const loadBillingInvoiceDataService = async (invoiceId) => {
  const payload = {
    query: `query getBillDetail {
      billDetail(
          aggregate: { sum: value }
          groupBy: [billId]
          orderBy: [productSlug_ASC, metricSlug_ASC]
          filter: {
            billId: ${invoiceId}
        }) {
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
  const parseInvoice = httpResponse.body.data?.billDetail.map((invoice) => {
    return {
      billId: invoice.billId,
      billDetailId: invoice.billDetailId,
      total: invoice.totalValue,
      currency: invoice.currency,
      billingPeriod: `${formatPeriod(invoice.periodFrom)} - ${formatPeriod(invoice.periodTo)}`,
      productChanges: '-',
      servicePlan: '-',
      creditUsedForPayment: 0.0,
      temporaryBill: invoice.temporaryBill
    }
  })
  return {
    body: parseInvoice?.length > 0 ? parseInvoice[0] : {},
    statusCode: httpResponse.statusCode
  }
}

const formatPeriod = (period) => {
  return period.split('-').reverse().join('/')
}
