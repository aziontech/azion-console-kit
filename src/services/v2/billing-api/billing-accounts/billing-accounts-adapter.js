const transformBillingAccount = (item = {}) => ({
  id: item.id,
  ownerAccountId: item.owner_account_id,
  currency: item.currency,
  country: item.country,
  taxId: item.tax_id ?? null,
  accountType: item.account_type,
  legalEntityName: item.legal_entity_name ?? null,
  status: item.status,
  gatewayCustomerRef: item.gateway_customer_ref ?? null,
  defaultPaymentMethodId: item.default_payment_method_id ?? null,
  audit: {
    createdAt: item.created_at,
    lastModified: item.last_modified,
    lastEditor: item.last_editor ?? null
  }
})

const transformCostBreakdownItem = (item = {}) => ({
  consumingAccountId: item.consuming_account_id,
  productId: item.product_id ?? null,
  amount: item.amount
})

const transformCostBreakdown = (item = {}) => ({
  accountId: item.account_id,
  period: item.period,
  currency: item.currency,
  total: item.total,
  items: Array.isArray(item.items) ? item.items.map(transformCostBreakdownItem) : []
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
  results: Array.isArray(envelope.results) ? envelope.results.map(transformBillingAccount) : []
})

const transformDetailResponse = (envelope = {}) => ({
  state: envelope?.state ?? null,
  data: envelope?.data ? transformBillingAccount(envelope.data) : null
})

const transformCostBreakdownResponse = (envelope = {}) => ({
  state: envelope?.state ?? null,
  data: envelope?.data ? transformCostBreakdown(envelope.data) : null
})

const toCreatePayload = (payload = {}) => ({
  currency: payload.currency,
  country: payload.country,
  ...(payload.accountType !== undefined && { account_type: payload.accountType }),
  ...(payload.taxId !== undefined && { tax_id: payload.taxId }),
  ...(payload.legalEntityName !== undefined && { legal_entity_name: payload.legalEntityName })
})

const toUpdatePayload = (payload = {}) => ({
  ...(payload.taxId !== undefined && { tax_id: payload.taxId }),
  ...(payload.legalEntityName !== undefined && { legal_entity_name: payload.legalEntityName })
})

const toListParams = (params = {}) => ({
  ...(params.page !== undefined && { page: params.page }),
  ...(params.pageSize !== undefined && { page_size: params.pageSize }),
  ...(params.fields !== undefined && { fields: params.fields }),
  ...(params.account !== undefined && { account: params.account }),
  ...(params.status !== undefined && { status: params.status })
})

const toCostBreakdownParams = (params = {}) => ({
  ...(params.period !== undefined && { period: params.period })
})

export const BillingAccountsAdapter = {
  transformBillingAccount,
  transformCostBreakdown,
  transformListResponse,
  transformDetailResponse,
  transformCostBreakdownResponse,
  toCreatePayload,
  toUpdatePayload,
  toListParams,
  toCostBreakdownParams
}
