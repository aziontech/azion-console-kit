import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeBillingBaseUrl } from './make-billing-base-url'
import { makeAccountingBaseUrl } from './make-accounting-base-url'
import { formatDateToUSBilling } from '@/helpers/convert-date'
import { getCurrentMonthStartEnd } from '@/helpers/get-current-month-start-end'
import { useAccountStore } from '@/stores/account'

export const loadCurrentInvoiceService = async () => {
  const { accountIsNotRegular } = useAccountStore()
  const payload = getQueryByAccountType(accountIsNotRegular)
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
  const emptyDefaultValue = '---'
  const {
    body: { data },
    statusCode
  } = httpResponse

  const invoiceData = accountIsNotRegular ? data?.billDetail?.[0] : data?.accountingDetail?.[0]
  const billingPeriod =
    invoiceData?.periodFrom && invoiceData?.periodTo
      ? `${formatDateToUSBilling(invoiceData.periodFrom)} - ${formatDateToUSBilling(
          invoiceData.periodTo
        )}`
      : emptyDefaultValue
  const parseInvoice = {
    redirectId: invoiceData?.billId,
    billId: invoiceData?.billId || emptyDefaultValue,
    total: invoiceData?.totalValue || 0,
    currency: invoiceData?.currency || emptyDefaultValue,
    billingPeriod,
    productChanges: emptyDefaultValue,
    servicePlan: emptyDefaultValue,
    creditUsedForPayment: invoiceData?.creditUsedForPayment || 0.0,
    temporaryBill: invoiceData?.temporaryBill || emptyDefaultValue
  }

  return {
    body: parseInvoice,
    statusCode
  }
}

const getQueryByAccountType = (accountIsNotRegular) => {
  const dateRange = getCurrentMonthStartEnd()

  if (accountIsNotRegular) {
    return {
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
            billDetailId,
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
  } else {
    return {
      query: `query {
        accountingDetail (
          limit: 1
          filter: {
            periodFromRange: {
              begin: "${dateRange.dateInitial}", end: "${dateRange.dateFinal}"
            }
          },
          groupBy: [billId]
        ) {
          billId,
          periodFrom,
          periodTo,
          accounted,
          invoiceNumber,
          regionName,
          productSlug,
          metricSlug
        }
      }`
    }
  }
}
