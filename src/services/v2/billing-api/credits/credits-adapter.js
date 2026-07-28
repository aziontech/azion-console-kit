const transformBalance = (item = {}) => ({
  accountId: item.account_id,
  currency: item.currency,
  availableAmount: item.available_amount
})

const transformCreditEntry = (item = {}) => ({
  id: item.id,
  accountId: item.account_id,
  amount: item.amount,
  remainingAmount: item.remaining_amount,
  type: item.type,
  sourceRef: item.source_ref ?? null,
  expiresAt: item.expires_at ?? null,
  audit: {
    createdAt: item.created_at ?? null,
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

const transformBalanceResponse = (envelope = {}) => ({
  state: envelope?.state ?? null,
  data: envelope?.data ? transformBalance(envelope.data) : null
})

const transformListResponse = (envelope = {}) => ({
  ...transformPagination(envelope),
  results: Array.isArray(envelope.results) ? envelope.results.map(transformCreditEntry) : []
})

const toListParams = (params = {}) => ({
  ...(params.page !== undefined && { page: params.page }),
  ...(params.pageSize !== undefined && { page_size: params.pageSize })
})

export const CreditsAdapter = {
  transformBalance,
  transformCreditEntry,
  transformBalanceResponse,
  transformListResponse,
  toListParams
}
