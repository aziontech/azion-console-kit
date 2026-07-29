const transformPendingTransition = (item) =>
  item
    ? {
        type: item.type ?? null,
        toPlanId: item.to_plan_id ?? null,
        toPlanPricingId: item.to_plan_pricing_id ?? null,
        effectiveDate: item.effective_date ?? null
      }
    : null

const transformSubscription = (item = {}) => ({
  id: item.id,
  type: item.type ?? null,
  status: item.status,
  planId: item.plan_id ?? null,
  planPricingId: item.plan_pricing_id ?? null,
  accountMode: item.account_mode ?? null,
  billingMode: item.billing_mode ?? null,
  startDate: item.start_date ?? null,
  endDate: item.end_date ?? null,
  currentPeriodStart: item.current_period_start ?? null,
  currentPeriodEnd: item.current_period_end ?? null,
  autoRenew: item.auto_renew ?? null,
  renew: item.renew ?? null,
  productVersion: item.product_version ?? null,
  onDemandEnabled: item.on_demand_enabled ?? null,
  pendingTransition: transformPendingTransition(item.pending_transition),
  audit: {
    createdAt: item.created_at ?? null,
    lastModified: item.last_modified ?? null,
    lastEditor: item.last_editor ?? null
  }
})

const transformScheduledChange = (item = {}) => ({
  id: item.id,
  subscriptionId: item.subscription_id,
  type: item.type,
  effectiveAt: item.effective_at,
  status: item.status,
  change: item.change
    ? {
        planId: item.change.plan_id ?? null,
        period: item.change.period ?? null
      }
    : null,
  audit: {
    createdAt: item.created_at,
    lastModified: item.last_modified,
    lastEditor: item.last_editor ?? null
  }
})

const transformSubscriptionVersion = (item = {}) => ({
  id: item.id,
  subscriptionId: item.subscription_id,
  serviceOrderId: item.service_order_id ?? null,
  orderActionId: item.order_action_id ?? null,
  planId: item.plan_id ?? null,
  period: item.period ?? null,
  billingMode: item.billing_mode ?? null,
  recurringFeeSnapshot: item.recurring_fee_snapshot ?? null,
  priceTableRef: item.price_table_ref
    ? { id: item.price_table_ref.id, version: item.price_table_ref.version }
    : null,
  effectiveFrom: item.effective_from ?? null,
  effectiveTo: item.effective_to ?? null,
  changeReason: item.change_reason ?? null,
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

const transformChangePreviewResponse = (envelope = {}) => {
  const data = envelope?.data ?? {}
  return {
    state: envelope?.state ?? null,
    currency: data.currency ?? null,
    immediateTotal: data.immediate_total ?? null,
    prorationBehavior: data.proration_behavior ?? null,
    lineItems: Array.isArray(data.line_items)
      ? data.line_items.map((line) => ({ description: line.description, amount: line.amount }))
      : [],
    nextPeriodStart: data.next_period_start ?? null,
    nextPeriodEnd: data.next_period_end ?? null
  }
}

const transformScheduledChangesListResponse = (envelope = {}) => ({
  ...transformPagination(envelope),
  results: Array.isArray(envelope.results) ? envelope.results.map(transformScheduledChange) : []
})

const transformScheduledChangeDetailResponse = (envelope = {}) => ({
  state: envelope?.state ?? null,
  data: envelope?.data ? transformScheduledChange(envelope.data) : null
})

const toListParams = (params = {}) => ({
  ...(params.page !== undefined && { page: params.page }),
  ...(params.pageSize !== undefined && { page_size: params.pageSize }),
  ...(params.fields !== undefined && { fields: params.fields }),
  ...(params.status && { status: params.status }),
  ...(params.serviceOrder !== undefined && { service_order: params.serviceOrder }),
  ...(params.billingAccount !== undefined && { billing_account: params.billingAccount }),
  ...(params.account !== undefined && { account: params.account }),
  ...(params.product !== undefined && { product: params.product })
})

const unwrap = (envelope) => (envelope && envelope.data !== undefined ? envelope.data : envelope)

const transformSubscriptionDetailResponse = (envelope = {}) => {
  const data = unwrap(envelope)
  return {
    state: envelope?.state ?? null,
    data: data?.id ? transformSubscription(data) : null
  }
}

const transformSubscriptionsListResponse = (envelope = {}) => ({
  ...transformPagination(envelope),
  results: Array.isArray(envelope.results) ? envelope.results.map(transformSubscription) : []
})

const transformVersionsListResponse = (envelope = {}) => ({
  ...transformPagination(envelope),
  results: Array.isArray(envelope.results) ? envelope.results.map(transformSubscriptionVersion) : []
})

const transformCreateResponse = (envelope = {}) => {
  const data = unwrap(envelope) ?? {}
  return {
    state: envelope?.state ?? null,
    subscription: data.id ? transformSubscription(data) : null,
    payment: data.payment
      ? { clientSecret: data.payment.client_secret ?? null, gateway: data.payment.gateway ?? null }
      : null
  }
}

const toChangePayload = (payload = {}) => ({
  ...(payload.planId != null && { plan_id: payload.planId }),
  ...(payload.period !== undefined && { period: payload.period }),
  ...(payload.prorationBehavior !== undefined && {
    proration_behavior: payload.prorationBehavior
  })
})

const toCreatePayload = (payload = {}) => ({
  plan_id: payload.planId,
  ...(payload.planPricingId != null && { plan_pricing_id: payload.planPricingId })
})

const toCancelPayload = (payload = {}) => ({
  ...(payload.when !== undefined && { when: payload.when }),
  ...(payload.reason !== undefined && payload.reason !== null && { reason: payload.reason })
})

const pickCurrentVersion = (versions) => {
  const results = Array.isArray(versions) ? versions : (versions?.results ?? [])
  if (!results.length) return null
  return (
    results.find((version) => !version.effectiveTo) ??
    [...results].sort((current, next) =>
      String(next.effectiveFrom ?? '').localeCompare(String(current.effectiveFrom ?? ''))
    )[0] ??
    null
  )
}

export const SubscriptionsAdapter = {
  transformSubscription,
  transformSubscriptionVersion,
  transformScheduledChange,
  transformChangePreviewResponse,
  transformScheduledChangesListResponse,
  transformScheduledChangeDetailResponse,
  transformSubscriptionDetailResponse,
  transformSubscriptionsListResponse,
  transformVersionsListResponse,
  transformCreateResponse,
  toChangePayload,
  toCreatePayload,
  toCancelPayload,
  toListParams,
  transformPendingTransition,
  pickCurrentVersion
}
