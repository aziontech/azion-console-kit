import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePaymentBaseUrl } from './make-payment-base-url'
import { makeAccountingBaseUrl } from './make-accounting-base-url'
import { formatDateToUS } from '@/helpers'
import { useAccountStore } from '@/stores/account'
import { getLastDayMonth } from '@/helpers/payment-history'
import { getLinkDownloadInvoice } from '@/helpers/invoice'
import { formatDateToMonthYear } from '@/helpers/convert-date'

const PAGE_SIZE = 200
const ACCOUNTING_LIST_LIMIT = 12

const STATUS_AS_TAG = {
  Paid: {
    content: 'Paid',
    icon: 'pi pi-check-circle',
    severity: 'success'
  },
  Pending: {
    content: 'Pending',
    icon: 'pi pi-calendar',
    severity: 'danger'
  },
  NotCharged: {
    content: 'Not charged',
    severity: 'info'
  }
}

export const listPaymentHistoryService = async () => {
  const { accountIsNotRegular } = useAccountStore()
  let httpResponse = accountIsNotRegular
    ? await listPaymentHistoryForNotRegularAccounts()
    : await listPaymentHistoryForRegularAccounts()

  return parseHttpResponse(httpResponse)
}

const listPaymentHistoryForNotRegularAccounts = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePaymentBaseUrl()}/history?page_size=${PAGE_SIZE}`,
    method: 'GET'
  })

  return adaptPaymentHistoryForNotRegularAccounts(httpResponse)
}

const listPaymentHistoryForRegularAccounts = async () => {
  const payload = {
    query: `
        query {
          accountingDetail (
            filter: {
              periodToLt: "${getLastDayMonth()}"
            },
            limit: ${ACCOUNTING_LIST_LIMIT},
            groupBy: [billId],
            orderBy: [periodTo_DESC]
          ) {
            billId,
            periodTo,
            accounted,
            invoiceNumber,
            regionName,
            productSlug,
            metricSlug
          }
        }`
  }

  let httpResponse = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: `${makeAccountingBaseUrl()}`,
    method: 'POST',
    body: payload
  })

  return adaptPaymentHistoryForRegularAccounts(httpResponse)
}

const adaptPaymentHistoryForNotRegularAccounts = (httpResponse) => {
  const parseBilling = httpResponse.body.results?.map((card) => {
    const typeCard = card.card_brand?.toLowerCase()
    return {
      amount: card.amount_with_currency,
      invoiceNumber: {
        content: card.invoice_number
      },
      paymentMethod: {
        cardNumber: card.payment_method_details,
        cardBrand: typeCard,
        value: `${typeCard} ${card.payment_method_details}`
      },
      disabled: !card.invoice_number,
      invoiceUrl: getLinkDownloadInvoice(formatDateToMonthYear(card.payment_due)),
      status: STATUS_AS_TAG[card.status] || STATUS_AS_TAG.NotCharged,
      paymentDate: formatDateToUS(card.payment_due)
    }
  })

  return {
    body: parseBilling || [],
    statusCode: httpResponse.statusCode
  }
}

const adaptPaymentHistoryForRegularAccounts = (httpResponse) => {
  const parseBilling = httpResponse.body.data.accountingDetail?.map((card) => {
    return {
      invoiceNumber: {
        content: card.billId
      },
      disabled: !card.billId,
      invoiceUrl: getLinkDownloadInvoice(formatDateToMonthYear(card.periodTo)),
      paymentDate: formatDateToUS(card.periodTo)
    }
  })

  return {
    body: parseBilling || [],
    statusCode: httpResponse.statusCode
  }
}
