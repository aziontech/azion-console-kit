import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePaymentBaseUrl } from './make-payment-base-url'
import { formatDateToUS, getStaticUrlsByEnvironment } from '@/helpers'

export const listPaymentHistoryService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePaymentBaseUrl()}/history?page_size=200`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const STATUS_AS_TAG = {
  Paid: {
    content: 'Paid',
    severity: 'success'
  },
  Pending: {
    content: 'Pending',
    severity: 'danger'
  },
  NotCharged: {
    content: 'Not charged',
    severity: 'info'
  }
}

const adapt = (httpResponse) => {
  const managerUrl = getStaticUrlsByEnvironment('manager')

  const parseBilling = httpResponse.body.data?.map((card) => {
    const typeCard = card.card_brand?.toLowerCase()
    const statusTag = STATUS_AS_TAG[card.status] || STATUS_AS_TAG.NotCharged
    const invoiceUrl = card.invoice_url ? `${managerUrl}${card.invoice_url}` : null
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
      invoiceUrl,
      status: statusTag,
      paymentDate: formatDateToUS(card.payment_due)
    }
  })

  return {
    body: parseBilling || [],
    statusCode: httpResponse.statusCode
  }
}
