import { PaymentsAdapter } from '@/services/v2/billing-api/payments/payments-adapter'

const transformInvoiceLineItem = (item = {}) => ({
  invoiceId: item.invoice_id,
  consumingAccountId: item.consuming_account_id,
  billId: item.bill_id ?? null,
  description: item.description,
  amount: item.amount
})

const transformInvoice = (item = {}) => ({
  id: item.id,
  accountId: item.account_id,
  billRefs: Array.isArray(item.bill_refs) ? item.bill_refs : [],
  amount: item.amount,
  currency: item.currency,
  status: item.status,
  billingMode: item.billing_mode ?? null,
  dueDate: item.due_date ?? null,
  issuedAt: item.issued_at ?? null,
  netTermsDays: item.net_terms_days ?? null,
  pdfUrl: item.pdf_url ?? null,
  lineItems: Array.isArray(item.line_items_snapshot)
    ? item.line_items_snapshot.map(transformInvoiceLineItem)
    : [],
  audit: {
    createdAt: item.created_at,
    lastModified: item.last_modified,
    lastEditor: item.last_editor ?? null
  }
})

const transformSettlement = (item = {}) => ({
  id: item.id,
  invoiceId: item.invoice_id,
  source: item.source,
  amount: item.amount,
  receivedAt: item.received_at ?? null,
  externalReference: item.external_reference ?? null,
  status: item.status,
  reconciled: Boolean(item.reconciled)
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
  results: Array.isArray(envelope.results) ? envelope.results.map(transformInvoice) : []
})

const transformDetailResponse = (envelope = {}) => ({
  state: envelope?.state ?? null,
  data: envelope?.data ? transformInvoice(envelope.data) : null
})

const transformLinesResponse = (response) =>
  Array.isArray(response) ? response.map(transformInvoiceLineItem) : []

const transformSettlementsResponse = (response) =>
  Array.isArray(response) ? response.map(transformSettlement) : []

const transformPdfResponse = (envelope = {}) => {
  const data = envelope?.data ?? {}
  return {
    state: envelope?.state ?? null,
    pdfUrl: data.pdf_url ?? null,
    isGenerating: data.status === 'generating'
  }
}

const toListParams = (params = {}) => ({
  ...(params.page !== undefined && { page: params.page }),
  ...(params.pageSize !== undefined && { page_size: params.pageSize }),
  ...(params.status && { status: params.status }),
  ...(params.period && { period: params.period }),
  ...(params.billingAccount !== undefined && { billing_account: params.billingAccount })
})

const transformPaymentResponse = (envelope = {}) => ({
  state: envelope?.state ?? null,
  data: envelope?.data ? PaymentsAdapter.transformPayment(envelope.data) : null
})

const toPayPayload = (payload = {}) => ({
  ...(payload.paymentMethodId !== undefined &&
    payload.paymentMethodId !== null && { payment_method_id: payload.paymentMethodId })
})

export const InvoicesAdapter = {
  transformInvoice,
  transformInvoiceLineItem,
  transformSettlement,
  transformListResponse,
  transformDetailResponse,
  transformLinesResponse,
  transformSettlementsResponse,
  transformPdfResponse,
  transformPaymentResponse,
  toListParams,
  toPayPayload
}
