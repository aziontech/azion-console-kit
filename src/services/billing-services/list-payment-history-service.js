import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountingBaseUrl } from './make-accounting-base-url'
import { useAccountStore } from '@/stores/account'
import { getLastDayMonth } from '@/helpers/payment-history'
import { getLinkDownloadInvoice } from '@/helpers/invoice'
import { formatDateToMonthYear, formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { paymentService } from '@/services/v2/payment/payment-service'

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

export const listPaymentHistoryService = async (params = {}) => {
  const { accountIsNotRegular } = useAccountStore()
  const ACCOUNT_IS_REGULAR = !accountIsNotRegular
  let httpResponse = accountIsNotRegular
    ? await listPaymentHistoryForNotRegularAccounts()
    : await listPaymentHistoryForRegularAccounts(params)

  if (ACCOUNT_IS_REGULAR) {
    httpResponse.body = removeCurrentPayment(httpResponse)
  }

  return parseHttpResponse(httpResponse)
}

const escapeGraphQLString = (value = '') => {
  if (!value || !value.length) return ''
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

const buildAccountingDetailFilterBlock = (params = {}) => {
  const periodToLt = params.periodToLt || getLastDayMonth()
  const periodToGte = params.periodToGte
  const invoiceNumber = params.invoiceNumber || params.invoice_number

  const lines = []
  if (periodToGte) {
    lines.push(`periodToGte: "${escapeGraphQLString(periodToGte)}"`)
  }
  if (periodToLt) {
    lines.push(`periodToLt: "${escapeGraphQLString(periodToLt)}"`)
  }
  if (invoiceNumber) {
    lines.push(`invoiceNumber: "${escapeGraphQLString(invoiceNumber)}"`)
  }

  if (!lines.length) {
    return ''
  }

  return `filter: {\n ${lines.join(',\n ')}\n },`
}

const removeCurrentPayment = (payments) => {
  if (!payments.body.length) return payments.body

  const currentMonth = new Date().toISOString().slice(0, 7)

  return payments.body.filter((payment) => {
    const match = String(payment.paymentDate).match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (match) {
      const month = match[2]
      const year = match[3]
      const formattedDate = `${year}-${month}`
      return formattedDate !== currentMonth
    }

    const parsed = new Date(payment.paymentDate)
    if (isNaN(parsed.getTime())) return true

    return parsed.toISOString().slice(0, 7) !== currentMonth
  })
}

const listPaymentHistoryForNotRegularAccounts = async () => {
  const body = await paymentService.listPaymentsHistory({
    pageSize: PAGE_SIZE
  })

  return adaptPaymentHistoryForNotRegularAccounts(body)
}

const listPaymentHistoryForRegularAccounts = async (params = {}) => {
  const filterBlock = buildAccountingDetailFilterBlock(params)
  const payload = {
    query: `
        query {
          accountingDetail (
            ${filterBlock}
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

const adaptPaymentHistoryForNotRegularAccounts = (results) => {
  const parseBilling = results?.map((card) => {
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
      paymentDate: formatDateToDayMonthYearHour(card.payment_due)
    }
  })

  return {
    body: parseBilling || [],
    statusCode: 200
  }
}

const adaptPaymentHistoryForRegularAccounts = (httpResponse) => {
  const parseBilling = httpResponse?.body?.data?.accountingDetail?.map((card) => {
    const disabledOpenInvoice = true

    return {
      invoiceNumber: {
        content: card.invoiceNumber || card.billId
      },
      billId: card.billId,
      disabled: disabledOpenInvoice,
      invoiceUrl: getLinkDownloadInvoice(formatDateToMonthYear(card.periodTo)),
      paymentDate: formatDateToDayMonthYearHour(card.periodTo)
    }
  })

  return {
    body: parseBilling || [],
    statusCode: httpResponse.statusCode
  }
}
