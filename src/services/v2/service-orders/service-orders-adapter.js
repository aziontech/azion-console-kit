import {
  resolvePaymentFromResponse,
  resolveServiceOrderPaymentMeta
} from './stripe-payment-resolver'

const transformPricing = (pricing = {}) => ({
  id: pricing.id ?? pricing.plan_pricing_id,
  currencyCode: pricing.currency_code,
  priceValue: pricing.price_value,
  periodicity: pricing.periodicity,
  active: pricing.active,
  validFrom: pricing.valid_from
})

const transformPlan = (item = {}) => ({
  id: item.id ?? item.plan_id,
  fallbackPlanId: item.fallback_plan_id,
  name: item.name,
  slug: item.slug,
  sku: item.sku,
  description: item.description,
  type: item.type,
  status: item.status,
  active: item.active,
  sortOrder: item.sort_order,
  eolDate: item.eol_date,
  revision: item.revision,
  publishedRevision: item.published_revision,
  publishedPublicationId: item.published_publication_id,
  reqContract: item.req_contract,
  trialCreditValue: item.trial_credit_value,
  trialCreditDurationDays: item.trial_credit_duration_days,
  trialCreditCurrency: item.trial_credit_currency,
  supportsReservedCapacity: item.supports_reserved_capacity,
  supportsSavingsPlan: item.supports_savings_plan,
  isInternal: item.is_internal,
  deletedAt: item.deleted_at,
  deletedBy: item.deleted_by,
  isPublicCatalog: item.is_public_catalog,
  allowSelfService: item.allow_self_service,
  requiresManualApproval: item.requires_manual_approval,
  whitelistOnly: item.whitelist_only,
  externalProductId: item.external_product_id,
  productVersion: item.product_version,
  audit: {
    lastEditor: item.last_editor ?? item.audit?.last_editor,
    lastModified: item.last_modified ?? item.audit?.last_modified,
    createdAt: item.created_at ?? item.audit?.created_at
  },
  pricings: Array.isArray(item.pricings) ? item.pricings.map(transformPricing) : []
})

const transformPlansList = (data) => {
  const plans = Array.isArray(data) ? data : data?.results
  return Array.isArray(plans) ? plans.map(transformPlan) : []
}

const transformPlanDetailResponse = (envelope = {}) => {
  const data = envelope?.data ?? null
  return {
    state: envelope?.state ?? null,
    data: data ? transformPlan(data) : null
  }
}

const toFiniteNumberOrNull = (value) => {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

const deriveDowngradePending = (data) => {
  if (data?.downgrade_pending && typeof data.downgrade_pending === 'object') {
    return {
      effectiveAt: data.downgrade_pending.effective_at ?? null,
      mode: data.downgrade_pending.mode ?? null
    }
  }
  const meta = data?.metadata
  if (meta && typeof meta === 'object' && meta.status === 'downgrade_pending') {
    return {
      effectiveAt: meta.effective_date ?? meta.effectiveDate ?? null,
      mode: meta.mode ?? null
    }
  }
  return null
}

const deriveInvoiceAmountCharged = (data) => {
  if (data?.current_invoice_amount_charged !== undefined) {
    return toFiniteNumberOrNull(data.current_invoice_amount_charged)
  }
  const meta = data?.metadata
  if (meta && typeof meta === 'object') {
    return toFiniteNumberOrNull(meta.amountCharged ?? meta.amount_charged)
  }
  return null
}

const transformServiceOrder = (data = {}) => {
  const { clientSecret, checkoutSessionId } = resolveServiceOrderPaymentMeta(data)

  return {
    serviceOrderId: data.id,
    type: data.type,
    status: data.status,
    planId: data.plan_id,
    priceId: data.plan_pricing_id,
    startDate: data.start_date,
    endDate: data.end_date,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    autoRenew: data.auto_renew,
    createdAt: data.created_at,
    updatedAt: data.last_modified,
    lastEditor: data.last_editor,
    productVersion: data.product_version,
    downgradePending: deriveDowngradePending(data),
    invoiceAmountCharged: deriveInvoiceAmountCharged(data),
    clientSecret,
    checkoutSessionId
  }
}

const transformTransition = (transition) => {
  if (!transition || typeof transition !== 'object') return null
  return {
    id: transition.id,
    type: transition.type,
    status: transition.status,
    fromPlanId: transition.from_plan_id,
    toPlanId: transition.to_plan_id,
    fromPriceId: transition.from_plan_pricing_id,
    toPriceId: transition.to_plan_pricing_id,
    effectiveImmediately: transition.effective_immediately,
    prorated: transition.prorated,
    scheduledAt: transition.scheduled_at,
    completedAt: transition.completed_at,
    createdAt: transition.created_at,
    updatedAt: transition.last_modified,
    lastEditor: transition.last_editor
  }
}

const transformListMeta = (envelope = {}) => ({
  count: envelope.count,
  totalPages: envelope.total_pages,
  page: envelope.page,
  pageSize: envelope.page_size,
  next: envelope.next,
  previous: envelope.previous
})

const transformListResponse = (envelope = {}) => ({
  data: Array.isArray(envelope.results) ? envelope.results.map(transformServiceOrder) : [],
  meta: transformListMeta(envelope)
})

const extractEnvelopeData = (envelope = {}) => envelope?.data ?? null

const transformDetailResponse = (envelope = {}) => {
  const data = extractEnvelopeData(envelope)
  return {
    state: envelope?.state ?? null,
    data: data ? transformServiceOrder(data) : null
  }
}

const transformSingleResponse = (envelope = {}) => {
  const data = extractEnvelopeData(envelope)
  const serviceOrder = data ? transformServiceOrder(data) : null
  return {
    state: envelope?.state ?? null,
    data: serviceOrder,
    payment: resolvePaymentFromResponse(envelope)
  }
}

const transformUpgradeResponse = (envelope = {}) => {
  const data = extractEnvelopeData(envelope) ?? {}
  return {
    state: envelope?.state ?? null,
    serviceOrder: data.service_order ? transformServiceOrder(data.service_order) : null,
    transition: transformTransition(data.transition),
    plan: data.plan ? transformPlan(data.plan) : null,
    immediate: data.immediate_update ?? false,
    proration: data.proration
      ? {
          amountDue: data.proration.amount_due,
          currency: data.proration.currency
        }
      : null,
    payment: resolvePaymentFromResponse({ data: data.service_order })
  }
}

const transformDowngradeResponse = (envelope = {}) => {
  const data = extractEnvelopeData(envelope) ?? {}
  return {
    state: envelope?.state ?? null,
    serviceOrder: data.service_order ? transformServiceOrder(data.service_order) : null,
    transition: transformTransition(data.transition),
    mode: data.mode ?? null,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? null,
    effectiveDate: data.effective_date ?? null,
    subscriptionScheduleId: data.subscription_schedule_id ?? null
  }
}

const transformCancelResponse = (envelope = {}) => {
  const data = extractEnvelopeData(envelope) ?? {}
  return {
    state: envelope?.state ?? null,
    serviceOrder: data.service_order ? transformServiceOrder(data.service_order) : null,
    transition: transformTransition(data.transition),
    cancelAtPeriodEnd: data.cancel_at_period_end ?? null
  }
}

const transformCancelDowngradeResponse = (envelope = {}) => {
  const data = extractEnvelopeData(envelope) ?? {}
  return {
    state: envelope?.state ?? null,
    serviceOrder: data.service_order ? transformServiceOrder(data.service_order) : null,
    transition: transformTransition(data.transition)
  }
}

const toCreatePayload = (payload = {}) => ({
  plan_id: payload.planId,
  ...(payload.planPricingId !== undefined && { plan_pricing_id: payload.planPricingId })
})

const toUpdatePayload = toCreatePayload

const toPlanChangePayload = (payload = {}) => {
  const planPricingId = payload.planPricingId ?? payload.priceId
  return {
    plan_id: payload.newPlanId ?? payload.planId,
    ...(planPricingId !== undefined && planPricingId !== null && { plan_pricing_id: planPricingId })
  }
}

export const ServiceOrdersAdapter = {
  transformPricing,
  transformPlan,
  transformPlansList,
  transformPlanDetailResponse,
  transformServiceOrder,
  transformTransition,
  transformListMeta,
  transformListResponse,
  transformDetailResponse,
  transformCreateResponse: transformSingleResponse,
  transformUpdateResponse: transformSingleResponse,
  transformUpgradeResponse,
  transformDowngradeResponse,
  transformCancelResponse,
  transformCancelDowngradeResponse,
  toCreatePayload,
  toUpdatePayload,
  toPlanChangePayload,
  toUpgradePayload: toPlanChangePayload,
  toDowngradePayload: toPlanChangePayload
}
