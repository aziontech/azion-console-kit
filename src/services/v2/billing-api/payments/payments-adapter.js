const transformAttempt = (attempt = {}) => ({
  attemptNo: attempt.attempt_no,
  status: attempt.status,
  errorCode: attempt.error_code ?? null,
  createdAt: attempt.created_at ?? null
})

const transformPayment = (item = {}) => ({
  id: item.id,
  invoiceId: item.invoice_id,
  accountId: item.account_id,
  amount: item.amount,
  currency: item.currency,
  paymentMethodId: item.payment_method_id ?? null,
  paymentMethodRef: item.payment_method_ref ?? null,
  gateway: item.gateway,
  gatewayChargeRef: item.gateway_charge_ref ?? null,
  status: item.status,
  attempts: Array.isArray(item.attempts) ? item.attempts.map(transformAttempt) : [],
  audit: {
    createdAt: item.created_at,
    lastModified: item.last_modified,
    lastEditor: item.last_editor ?? null
  }
})

const transformPagination = (envelope = {}) => ({
  count: envelope.count ?? 0,
  totalPages: envelope.total_pages ?? 0,
  page: envelope.page ?? 1,
  pageSize: envelope.page_size ?? 0,
  next: envelope.next ?? null,
  previous: envelope.previous ?? null
})

const transformListResponse = (envelope = {}) => ({
  ...transformPagination(envelope),
  results: Array.isArray(envelope.results) ? envelope.results.map(transformPayment) : []
})

const transformDetailResponse = (envelope = {}) => ({
  state: envelope?.state ?? null,
  data: envelope?.data ? transformPayment(envelope.data) : null
})

const toListParams = (params = {}) => ({
  ...(params.page !== undefined && { page: params.page }),
  ...(params.pageSize !== undefined && { page_size: params.pageSize }),
  ...(params.fields !== undefined && { fields: params.fields }),
  ...(params.invoice !== undefined && { invoice: params.invoice }),
  ...(params.status !== undefined && { status: params.status })
})

const STATUS_AS_TAG = Object.freeze({
  succeeded: { content: 'Paid', icon: 'pi pi-check-circle', severity: 'success' },
  processing: { content: 'Processing', icon: 'pi pi-clock', severity: 'info' },
  pending: { content: 'Pending', icon: 'pi pi-calendar', severity: 'warning' },
  failed: { content: 'Failed', icon: 'pi pi-times-circle', severity: 'danger' },
  disputed: { content: 'Disputed', icon: 'pi pi-exclamation-triangle', severity: 'danger' },
  refunded: { content: 'Refunded', icon: 'pi pi-replay', severity: 'info' }
})

const NOT_CHARGED_TAG = Object.freeze({ content: 'Not charged', severity: 'info' })

const formatAmount = (cents, currency) => {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '---'
  const value = (cents / 100).toFixed(2)
  return currency ? `${currency} ${value}` : value
}

const resolveCard = (payment, paymentMethods) => {
  const methods = Array.isArray(paymentMethods) ? paymentMethods : []
  const match = methods.find(
    (method) =>
      method.id === payment.paymentMethodId ||
      method.id === payment.paymentMethodRef ||
      method.paymentMethodRef === payment.paymentMethodRef
  )
  if (!match) return null
  const brand = match.brand?.toLowerCase() ?? null
  const cardNumber = match.last4 ? `Ending in ${match.last4}` : null
  return {
    cardNumber,
    cardBrand: brand,
    value: [brand, match.last4].filter(Boolean).join(' ')
  }
}

const toHistoryRow = (payment, { paymentMethods, formatDate } = {}) => {
  const invoiceId = payment.invoiceId ?? null
  const card = resolveCard(payment, paymentMethods)

  return {
    id: payment.id,
    amount: formatAmount(payment.amount, payment.currency),
    invoiceNumber: { content: invoiceId, id: invoiceId ?? payment.id },
    ...(card && { paymentMethod: card }),
    disabled: !invoiceId,
    isFallback: !invoiceId,
    status: STATUS_AS_TAG[payment.status] ?? NOT_CHARGED_TAG,
    paymentDate: formatDate ? formatDate(payment.audit?.createdAt) : payment.audit?.createdAt
  }
}

const toHistoryRows = (payments, options = {}) =>
  (Array.isArray(payments) ? payments : []).map((payment) => toHistoryRow(payment, options))

export const PaymentsAdapter = {
  transformPayment,
  transformListResponse,
  transformDetailResponse,
  toListParams,
  toHistoryRow,
  toHistoryRows,
  PAYMENT_STATUS_TAGS: STATUS_AS_TAG
}
