import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeBillingBaseUrl } from './make-billing-base-url'
import { formatDateToUSBilling, formatDateToMonthYear } from '@/helpers/convert-date'
import { makeAccountingBaseUrl } from './make-accounting-base-url'
import { useAccountStore } from '@/stores/account'
import { getLinkDownloadInvoice } from '@/helpers/invoice'

export const loadInvoiceDataService = async (invoiceId) => {
  const { accountIsNotRegular } = useAccountStore()
  const payload = getQueryByAccountType(accountIsNotRegular, invoiceId)
  const url = accountIsNotRegular ? `${makeBillingBaseUrl()}` : `${makeAccountingBaseUrl()}`

  let httpResponse = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url,
    method: 'POST',
    body: payload
  })

  httpResponse = adapt(httpResponse, accountIsNotRegular)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, accountIsNotRegular) => {
  const {
    body: { data },
    statusCode
  } = httpResponse
  const invoiceData = accountIsNotRegular ? data?.billDetail : data?.accountingDetail
  const parseInvoice = invoiceData?.map((invoice) => {
    const period = formatDateToMonthYear(invoice.periodFrom)
    if (accountIsNotRegular) {
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
        temporaryBill: invoice.temporaryBill,
        invoiceDownloadURL: getLinkDownloadInvoice(period)
      }
    }
    return {
      billId: invoice.billId,
      invoiceId: invoice.invoiceNumber,
      billingPeriod: `${formatDateToUSBilling(invoice.periodFrom)} - ${formatDateToUSBilling(
        invoice.periodTo
      )}`,
      invoiceDownloadURL: getLinkDownloadInvoice(period)
    }
  })
  return {
    body: parseInvoice?.length > 0 ? parseInvoice[0] : null,
    statusCode
  }
}

const getQueryByAccountType = (accountIsNotRegular, invoiceId) => {
  if (accountIsNotRegular) {
    return {
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
            billDetailId,
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
  }

  return {
    query: `query ($billID: ID!) {
      accountingDetail (
        limit: 1,
        filter: {
          billId: $billID,
        },
        orderBy: [productSlug_ASC, metricSlug_ASC],
        groupBy: [billId]
      ) {
        billId,
        periodTo,
        periodFrom,
        accounted,
        invoiceNumber,
      }
    }`,
    variables: {
      billID: invoiceId
    }
  }
}
