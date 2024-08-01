import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeBillingBaseUrl } from './make-billing-base-url'
import { formatDateToUSBilling } from '@/helpers/convert-date'

export const loadInvoiceDataService = async (invoiceId) => {
  const payload = {
    query: `query getBillDetail($billID: ID!, $invoiceId: String!) {
      billDetail(
        aggregate: { sum: value }
        groupBy: [billId]
        orderBy: [productSlug_ASC, metricSlug_ASC]
        filter: {
          or: [
            { billId: $billID },
            { invoiceNumberEq: $invoiceId }
          ]
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
    }`,
    variables: {
      billID: invoiceId,
      invoiceId
    }
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
      billingPeriod: `${formatDateToUSBilling(invoice.periodFrom)} - ${formatDateToUSBilling(
        invoice.periodTo
      )}`,
      productChanges: '---',
      servicePlan: '---',
      creditUsedForPayment: 0.0,
      temporaryBill: invoice.temporaryBill
    }
  })
  return {
    body: parseInvoice?.length > 0 ? parseInvoice[0] : null,
    statusCode: httpResponse.statusCode
  }
}
