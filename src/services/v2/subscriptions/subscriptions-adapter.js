const transformPriceTableRef = (ref) => {
  if (!ref || typeof ref !== 'object') return null
  return {
    id: ref.id,
    version: ref.version
  }
}

const transformSubscription = (item = {}) => ({
  id: item.id,
  serviceOrderId: item.service_order_id,
  currentVersionId: item.current_version_id ?? null,
  status: item.status,
  currentPeriodStart: item.current_period_start ?? null,
  currentPeriodEnd: item.current_period_end ?? null,
  anniversaryDay: item.anniversary_day ?? null,
  cancelAtPeriodEnd: item.cancel_at_period_end,
  audit: {
    createdAt: item.created_at,
    lastModified: item.last_modified,
    lastEditor: item.last_editor ?? null
  }
})

const transformSubscriptionVersion = (item = {}) => ({
  id: item.id,
  subscriptionId: item.subscription_id,
  serviceOrderId: item.service_order_id,
  orderActionId: item.order_action_id ?? null,
  planId: item.plan_id,
  period: item.period,
  billingMode: item.billing_mode,
  recurringFeeSnapshot: item.recurring_fee_snapshot,
  priceTableRef: transformPriceTableRef(item.price_table_ref),
  effectiveFrom: item.effective_from,
  effectiveTo: item.effective_to ?? null,
  changeReason: item.change_reason ?? null,
  audit: {
    createdAt: item.created_at,
    lastModified: item.last_modified,
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
  results: Array.isArray(envelope.results) ? envelope.results.map(transformSubscription) : []
})

const transformDetailResponse = (envelope = {}) => ({
  state: envelope?.state ?? null,
  data: envelope?.data ? transformSubscription(envelope.data) : null
})

const transformCreateResponse = (envelope = {}) => {
  const data = envelope?.data ?? {}
  return {
    state: envelope?.state ?? null,
    subscription: data.subscription ? transformSubscription(data.subscription) : null,
    payment: data.payment
      ? {
          clientSecret: data.payment.client_secret,
          gateway: data.payment.gateway
        }
      : null
  }
}

const transformChangePreviewResponse = (envelope = {}) => {
  const data = envelope?.data ?? {}
  return {
    state: envelope?.state ?? null,
    currency: data.currency ?? null,
    immediateTotal: data.immediate_total ?? null,
    prorationBehavior: data.proration_behavior ?? null,
    lineItems: Array.isArray(data.line_items)
      ? data.line_items.map((line) => ({
          description: line.description,
          amount: line.amount
        }))
      : [],
    nextPeriodStart: data.next_period_start ?? null,
    nextPeriodEnd: data.next_period_end ?? null
  }
}

const transformVersionsListResponse = (envelope = {}) => ({
  ...transformPagination(envelope),
  results: Array.isArray(envelope.results) ? envelope.results.map(transformSubscriptionVersion) : []
})

const transformScheduledChangesListResponse = (envelope = {}) => ({
  ...transformPagination(envelope),
  results: Array.isArray(envelope.results) ? envelope.results.map(transformScheduledChange) : []
})

const transformScheduledChangeDetailResponse = (envelope = {}) => ({
  state: envelope?.state ?? null,
  data: envelope?.data ? transformScheduledChange(envelope.data) : null
})

const toCreatePayload = (payload = {}) => ({
  plan_id: payload.planId,
  ...(payload.period !== undefined && { period: payload.period }),
  ...(payload.accountId !== undefined && { account_id: payload.accountId }),
  ...(payload.paymentMethodId !== undefined && { payment_method_id: payload.paymentMethodId }),
  ...(payload.tosAcceptance?.version !== undefined && {
    tos_acceptance: { version: payload.tosAcceptance.version }
  })
})

const toChangePayload = (payload = {}) => ({
  ...(payload.planId !== undefined && { plan_id: payload.planId }),
  ...(payload.period !== undefined && { period: payload.period }),
  ...(payload.prorationBehavior !== undefined && {
    proration_behavior: payload.prorationBehavior
  }),
  ...(payload.when !== undefined && { when: payload.when })
})

const toCancelPayload = (payload = {}) => ({
  ...(payload.when !== undefined && { when: payload.when }),
  ...(payload.reason !== undefined && { reason: payload.reason })
})

const toListParams = (params = {}) => ({
  ...(params.page !== undefined && { page: params.page }),
  ...(params.pageSize !== undefined && { page_size: params.pageSize }),
  ...(params.fields !== undefined && { fields: params.fields }),
  ...(params.billingAccount !== undefined && { billing_account: params.billingAccount }),
  ...(params.serviceOrder !== undefined && { service_order: params.serviceOrder }),
  ...(params.account !== undefined && { account: params.account }),
  ...(params.product !== undefined && { product: params.product }),
  ...(params.status !== undefined && { status: params.status })
})

export const SubscriptionsAdapter = {
  transformSubscription,
  transformSubscriptionVersion,
  transformScheduledChange,
  transformListResponse,
  transformDetailResponse,
  transformCreateResponse,
  transformChangePreviewResponse,
  transformVersionsListResponse,
  transformScheduledChangesListResponse,
  transformScheduledChangeDetailResponse,
  toCreatePayload,
  toChangePayload,
  toCancelPayload,
  toListParams
}
