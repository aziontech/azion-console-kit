import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeBillingBaseUrl } from './make-billing-base-url'
import { makeAccountingBaseUrl } from './make-accounting-base-url'
import { formatDateToUSBilling } from '@/helpers/convert-date'
import { useAccountStore } from '@/stores/account'

export const loadCurrentInvoiceService = async () => {
  const { accountIsNotRegular } = useAccountStore()
  const payload = getQueryByAccountType(accountIsNotRegular)
  const url = accountIsNotRegular ? `${makeBillingBaseUrl()}` : `${makeAccountingBaseUrl()}`

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url,
      method: 'POST',
      body: payload
    },
    graphQLApi
  )

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
  const billingPeriod = invoiceData?.periodFrom && invoiceData?.periodTo ? `${formatDateToUSBilling(invoiceData.periodFrom)} - ${formatDateToUSBilling(invoiceData.periodTo)}` : emptyDefaultValue
  const parseInvoice = {
    billId: invoiceData?.billId || emptyDefaultValue,
    total: invoiceData?.totalValue || emptyDefaultValue,
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
