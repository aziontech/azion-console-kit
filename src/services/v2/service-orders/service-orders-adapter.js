import {
  resolvePaymentFromResponse,
  resolveServiceOrderPaymentMeta
} from './stripe-payment-resolver'

const pick = (value, fallback) => (value !== undefined ? value : fallback)

const hasServiceOrderData = (data) => {
  if (!data || typeof data !== 'object') return false
  return Boolean(
    pick(data.serviceOrderId, data.service_order_id) ||
      pick(data.accountId, data.account_id) ||
      pick(data.planId, data.plan_id)
  )
}

const extractServiceOrderData = (response) => {
  if (!response) return null
  const data = response.data ?? response.results
  if (hasServiceOrderData(data)) return data
  if (hasServiceOrderData(response)) return response
  return null
}

const transformPricing = (pricing = {}) => ({
  id: pricing.plan_pricing_id,
  currencyCode: pricing.currency_code,
  priceValue: pricing.price_value,
  periodicity: pricing.periodicity,
  active: pricing.active,
  validFrom: pricing.valid_from
})

const transformPlan = (item = {}) => ({
  id: item.plan_id,
  fallbackPlanId: item.fallback_plan_id,
  name: item.name,
  slug: item.slug,
  sku: item.sku,
  description: item.description,
  type: item.type,
  status: item.status,
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
  sortOrder: item.sort_order,
  active: item.active,
  deletedAt: item.deleted_at,
  deletedBy: item.deleted_by,
  isPublicCatalog: item.is_public_catalog,
  allowSelfService: item.allow_self_service,
  requiresManualApproval: item.requires_manual_approval,
  whitelistOnly: item.whitelist_only,
  externalProductId: item.external_product_id,
  audit: {
    lastEditor: item.audit?.last_editor,
    lastModified: item.audit?.last_modified,
    createdAt: item.audit?.created_at
  },
  pricings: Array.isArray(item.pricings) ? item.pricings.map(transformPricing) : []
})

const transformPlansList = (data) => {
  const plans = Array.isArray(data) ? data : data?.results
  return Array.isArray(plans) ? plans.map(transformPlan) : []
}

const transformServiceOrder = (data = {}) => {
  const { clientSecret, checkoutSessionId } = resolveServiceOrderPaymentMeta(data)

  return {
    serviceOrderId: pick(data.serviceOrderId, data.service_order_id),
    accountId: pick(data.accountId, data.account_id),
    planId: pick(data.planId, data.plan_id),
    priceId: pick(
      data.priceId,
      pick(data.price_id, pick(data.planPricingId, data.plan_pricing_id))
    ),
    type: data.type,
    status: data.status,
    gatewayId: pick(data.gatewayId, data.gateway_id),
    startDate: pick(data.startDate, data.start_date),
    endDate: pick(data.endDate, data.end_date),
    currentPeriodStart: pick(data.currentPeriodStart, data.current_period_start),
    currentPeriodEnd: pick(data.currentPeriodEnd, data.current_period_end),
    autoRenew: pick(data.autoRenew, data.auto_renew),
    ip: data.ip,
    port: data.port,
    ipFwd: pick(data.ipFwd, data.ip_fwd),
    portFwd: pick(data.portFwd, data.port_fwd),
    timezone: data.timezone,
    metadata: data.metadata ?? {},
    clientSecret,
    checkoutSessionId,
    lastEditor: pick(data.lastEditor, data.last_editor),
    createdAt: pick(data.createdAt, data.created_at),
    updatedAt: pick(data.updatedAt, data.updated_at)
  }
}

const transformMeta = (meta = {}) => ({
  count: meta.count,
  total: meta.total,
  limit: meta.limit,
  offset: meta.offset,
  requestId: pick(meta.requestId, meta.request_id)
})

const transformTransition = (transition) => {
  if (!transition || typeof transition !== 'object') return null
  return {
    from: pick(transition.from, transition.fromPlan),
    to: pick(transition.to, transition.toPlan),
    effectiveAt: pick(transition.effectiveAt, transition.effective_at),
    type: transition.type
  }
}

const baseResponseEnvelope = (response) => ({
  success: response?.success ?? true,
  message: response?.message ?? null,
  meta: transformMeta(response?.meta),
  payment: resolvePaymentFromResponse(response)
})

const transformListResponse = (response = {}) => ({
  ...baseResponseEnvelope(response),
  data: Array.isArray(response.results) ? response.results.map(transformServiceOrder) : []
})

const transformSingleResponse = (response = {}) => {
  const so = extractServiceOrderData(response)
  return {
    ...baseResponseEnvelope(response),
    data: so ? transformServiceOrder(so) : null
  }
}

const transformDetailResponse = (response = {}) => {
  const body = response ?? {}
  const so =
    (body.data && typeof body.data === 'object' ? body.data : null) ??
    (Array.isArray(body.results) ? body.results[0] : body.results) ??
    (hasServiceOrderData(body) ? body : null)
  return {
    success: body.success ?? true,
    data: so ? transformServiceOrder(so) : null,
    meta: transformMeta(body.meta)
  }
}

const transformUpgradeResponse = (response = {}) => {
  const data = response.data ?? response
  const currentOrder = pick(data?.currentOrder, data?.current_order)
  const newPlan = pick(data?.newPlan, data?.new_plan)
  const transition = pick(data?.transition, data?.planTransition)
  const immediate = pick(data?.immediateUpdate, pick(data?.immediate_update, data?.immediate))

  return {
    ...baseResponseEnvelope(response),
    serviceOrder: currentOrder ? transformServiceOrder(currentOrder) : null,
    newPlan: newPlan ? transformPlan(newPlan) : null,
    transition: transformTransition(transition),
    immediate: immediate ?? true
  }
}

const transformDowngradeResponse = (response = {}) => {
  const data = response.data ?? response
  const so = pick(data?.serviceOrder, data?.service_order)
  const schedule = pick(data?.schedule, data?.subscriptionSchedule)
  const newPlanId = pick(data?.newPlanId, data?.new_plan_id)

  return {
    ...baseResponseEnvelope(response),
    serviceOrder: so ? transformServiceOrder(so) : null,
    schedule: schedule ?? null,
    newPlanId: newPlanId ?? null
  }
}

const transformCancelDowngradeResponse = (response = {}) => {
  const data = response.data ?? response
  const so = pick(data?.serviceOrder, data?.service_order)
  const transition = pick(data?.transition, data?.planTransition)

  return {
    ...baseResponseEnvelope(response),
    serviceOrder: so ? transformServiceOrder(so) : null,
    transition: transformTransition(transition)
  }
}

const toCreatePayload = (payload = {}) => ({
  planId: payload.planId,
  priceId: pick(payload.priceId, payload.planPricingId)
})

const toUpdatePayload = (payload = {}) => ({
  planId: payload.planId,
  priceId: pick(payload.priceId, payload.planPricingId),
  status: payload.status,
  type: payload.type,
  gatewayId: payload.gatewayId,
  startDate: payload.startDate,
  endDate: payload.endDate,
  currentPeriodStart: payload.currentPeriodStart,
  currentPeriodEnd: payload.currentPeriodEnd,
  autoRenew: payload.autoRenew,
  ip: payload.ip,
  port: payload.port,
  ipFwd: payload.ipFwd,
  portFwd: payload.portFwd,
  timezone: payload.timezone,
  metadata: payload.metadata,
  lastEditor: payload.lastEditor
})

// Upgrade and downgrade share the same wire shape — the action is decided by
// which endpoint receives the payload, not by the body.
const toPlanChangePayload = (payload = {}) => {
  const priceId = pick(payload.priceId, payload.planPricingId)
  return {
    newPlanId: payload.newPlanId,
    ...(priceId && { priceId })
  }
}

export const ServiceOrdersAdapter = {
  transformPricing,
  transformPlan,
  transformPlansList,
  transformServiceOrder,
  transformMeta,
  transformTransition,
  transformListResponse,
  transformDetailResponse,
  transformCreateResponse: transformSingleResponse,
  transformUpdateResponse: transformSingleResponse,
  transformUpgradeResponse,
  transformDowngradeResponse,
  transformCancelDowngradeResponse,
  toCreatePayload,
  toUpdatePayload,
  toUpgradePayload: toPlanChangePayload,
  toDowngradePayload: toPlanChangePayload
}
