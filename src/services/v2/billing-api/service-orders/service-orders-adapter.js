const transformPriceTableRef = (ref) =>
  ref ? { id: ref.id ?? null, version: ref.version ?? null } : null

const transformCommercialItem = (item = {}) => ({
  productId: item.product_id ?? null,
  planId: item.plan_id ?? null,
  quantity: item.quantity ?? null,
  metric: item.metric ?? null,
  discountPct: item.discount_pct ?? null
})

const transformCommercialTerms = (terms) =>
  terms
    ? {
        amendmentOf: terms.amendment_of ?? null,
        poNumber: terms.po_number ?? null,
        netTermsDays: terms.net_terms_days ?? null,
        salesOwner: terms.sales_owner ?? null,
        autoRenewal: terms.auto_renewal ?? null,
        startDate: terms.start_date ?? null,
        endDate: terms.end_date ?? null,
        terminationTerms: terms.termination_terms ?? null
      }
    : null

const transformAudit = (item = {}) => ({
  createdAt: item.created_at ?? null,
  lastModified: item.last_modified ?? null,
  lastEditor: item.last_editor ?? null
})

const transformServiceOrder = (item = {}) => ({
  id: item.id,
  subscriptionId: item.subscription_id ?? null,
  customerAgreementId: item.customer_agreement_id ?? null,
  orderNumber: item.order_number ?? null,
  type: item.type ?? null,
  status: item.status,
  period: item.period ?? null,
  billingMode: item.billing_mode ?? null,
  commercialItems: Array.isArray(item.commercial_items)
    ? item.commercial_items.map(transformCommercialItem)
    : [],
  commercialTerms: transformCommercialTerms(item.commercial_terms),
  termsConditionsId: item.terms_conditions_id ?? null,
  termsConditionsExecutionId: item.terms_conditions_execution_id ?? null,
  orderFormExecutionId: item.order_form_execution_id ?? null,
  requiredDocumentVersionIds: Array.isArray(item.required_document_version_ids)
    ? item.required_document_version_ids
    : [],
  priceTableRef: transformPriceTableRef(item.price_table_ref),
  effectiveFrom: item.effective_from ?? null,
  effectiveTo: item.effective_to ?? null,
  audit: transformAudit(item)
})

const transformOrderAction = (item = {}) => ({
  id: item.id,
  serviceOrderId: item.service_order_id ?? null,
  actionType: item.action_type ?? null,
  status: item.status,
  effectiveAt: item.effective_at ?? null,
  signedDocRef: item.signed_doc_ref ?? null,
  reason: item.reason ?? null,
  operationKey: item.operation_key ?? null,
  audit: transformAudit(item)
})

const transformAgreementExecution = (item = {}) => ({
  id: item.id,
  targetType: item.target_type ?? null,
  targetId: item.target_id ?? null,
  method: item.method ?? null,
  status: item.status ?? null,
  acceptedBy: item.accepted_by ?? null,
  acceptedAt: item.accepted_at ?? null,
  signedAt: item.signed_at ?? null
})

const transformLegalDocument = (item = {}) => ({
  id: item.id,
  type: item.type ?? null,
  title: item.title ?? null,
  version: item.version ?? null,
  publicUrl: item.public_url ?? null,
  checksum: item.checksum ?? null,
  effectiveFrom: item.effective_from ?? null
})

const transformTerms = (item = {}) => ({
  termsConditionsId: item.terms_conditions_id ?? item.id ?? null,
  type: item.type ?? null,
  scope: item.scope ?? null,
  status: item.status ?? null,
  documents: Array.isArray(item.documents) ? item.documents.map(transformLegalDocument) : [],
  executions: Array.isArray(item.executions) ? item.executions.map(transformAgreementExecution) : []
})

const transformPagination = (envelope = {}) => ({
  count: envelope.count ?? 0,
  totalPages: envelope.total_pages ?? 0,
  page: envelope.page ?? 1,
  pageSize: envelope.page_size ?? 0
})

const unwrap = (envelope) => (envelope && envelope.data !== undefined ? envelope.data : envelope)

const transformListResponse = (envelope = {}) => ({
  ...transformPagination(envelope),
  results: Array.isArray(envelope.results) ? envelope.results.map(transformServiceOrder) : []
})

const transformDetailResponse = (envelope = {}) => {
  const data = unwrap(envelope)
  return {
    state: envelope?.state ?? null,
    data: data?.id ? transformServiceOrder(data) : null
  }
}

const transformActionsListResponse = (envelope = {}) => ({
  ...transformPagination(envelope),
  results: Array.isArray(envelope.results) ? envelope.results.map(transformOrderAction) : []
})

const transformActionDetailResponse = (envelope = {}) => {
  const data = unwrap(envelope)
  return {
    state: envelope?.state ?? null,
    data: data?.id ? transformOrderAction(data) : null
  }
}

const transformTermsResponse = (envelope = {}) => {
  const data = unwrap(envelope)
  return {
    state: envelope?.state ?? null,
    data: data ? transformTerms(data) : null
  }
}

const toListParams = (params = {}) => ({
  ...(params.page !== undefined && { page: params.page }),
  ...(params.pageSize !== undefined && { page_size: params.pageSize }),
  ...(params.fields !== undefined && { fields: params.fields }),
  ...(params.account !== undefined && { account: params.account }),
  ...(params.billingAccount !== undefined && { billing_account: params.billingAccount }),
  ...(params.status !== undefined && { status: params.status })
})

const toFieldsParams = (params = {}) => ({
  ...(params.fields !== undefined && { fields: params.fields })
})

const toCommercialItemPayload = (item = {}) => ({
  ...(item.productId !== undefined && { product_id: item.productId }),
  ...(item.planId !== undefined && { plan_id: item.planId }),
  ...(item.quantity !== undefined && { quantity: item.quantity }),
  ...(item.metric !== undefined && { metric: item.metric }),
  ...(item.discountPct !== undefined && { discount_pct: item.discountPct })
})

const toCreatePayload = (payload = {}) => ({
  period: payload.period,
  commercial_items: Array.isArray(payload.commercialItems)
    ? payload.commercialItems.map(toCommercialItemPayload)
    : [],
  ...(payload.accountId != null && { account_id: payload.accountId }),
  ...(payload.billingMode !== undefined && { billing_mode: payload.billingMode }),
  ...(payload.tosVersion != null && { tos_acceptance: { version: payload.tosVersion } }),
  ...(payload.contract !== undefined && { contract: payload.contract })
})

const toUpdatePayload = (payload = {}) => ({
  ...(payload.orderNumber !== undefined && { order_number: payload.orderNumber })
})

const toActionPayload = (payload = {}) => ({
  action_type: payload.actionType,
  ...(payload.effectiveAt !== undefined && { effective_at: payload.effectiveAt }),
  ...(payload.reason !== undefined && { reason: payload.reason }),
  ...(payload.signedDocRef !== undefined && { signed_doc_ref: payload.signedDocRef }),
  ...(payload.change !== undefined && { change: payload.change })
})

const toCancelPayload = (payload = {}) => ({
  ...(payload.reason !== undefined && payload.reason !== null && { reason: payload.reason })
})

export const ServiceOrdersAdapter = {
  transformServiceOrder,
  transformOrderAction,
  transformTerms,
  transformListResponse,
  transformDetailResponse,
  transformActionsListResponse,
  transformActionDetailResponse,
  transformTermsResponse,
  toListParams,
  toFieldsParams,
  toCreatePayload,
  toUpdatePayload,
  toActionPayload,
  toCancelPayload
}
