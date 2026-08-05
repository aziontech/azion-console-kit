export const SUBSCRIPTION_TYPE = Object.freeze({
  PLAN_SUBSCRIPTION: 'plan_subscription'
})

export const SUBSCRIPTION_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  BLOCKED: 'BLOCKED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED'
})

export const SUBSCRIPTION_ENTITLED_STATUSES = Object.freeze([
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.PAST_DUE
])

export const SUBSCRIPTION_TERMINAL_STATUSES = Object.freeze([
  SUBSCRIPTION_STATUS.CANCELED,
  SUBSCRIPTION_STATUS.EXPIRED
])

export const SUBSCRIPTION_CHECKOUT_PENDING_STATUSES = Object.freeze([SUBSCRIPTION_STATUS.DRAFT])

export const SUBSCRIPTION_SUSPENDED_STATUSES = Object.freeze([SUBSCRIPTION_STATUS.BLOCKED])

const SPEC_STATUS_ALIASES = Object.freeze({
  incomplete: SUBSCRIPTION_STATUS.DRAFT,
  active: SUBSCRIPTION_STATUS.ACTIVE,
  past_due: SUBSCRIPTION_STATUS.PAST_DUE,
  suspended: SUBSCRIPTION_STATUS.BLOCKED,
  cancelled: SUBSCRIPTION_STATUS.CANCELED,
  canceled: SUBSCRIPTION_STATUS.CANCELED,
  expired: SUBSCRIPTION_STATUS.EXPIRED
})

const CANONICAL_STATUSES = Object.freeze(Object.values(SUBSCRIPTION_STATUS))

export const normalizeSubscriptionStatus = (status) => {
  if (status === null || status === undefined || status === '') return null
  const raw = String(status).trim()
  const upper = raw.toUpperCase()
  if (CANONICAL_STATUSES.includes(upper)) return upper
  return SPEC_STATUS_ALIASES[raw.toLowerCase()] ?? upper
}

export const isEntitledStatus = (status) =>
  SUBSCRIPTION_ENTITLED_STATUSES.includes(normalizeSubscriptionStatus(status))

export const isTerminalStatus = (status) =>
  SUBSCRIPTION_TERMINAL_STATUSES.includes(normalizeSubscriptionStatus(status))

export const isCheckoutPendingStatus = (status) =>
  SUBSCRIPTION_CHECKOUT_PENDING_STATUSES.includes(normalizeSubscriptionStatus(status))

export const isSuspendedStatus = (status) =>
  SUBSCRIPTION_SUSPENDED_STATUSES.includes(normalizeSubscriptionStatus(status))

export const BILLING_PERIOD = Object.freeze({
  MONTHLY: 'monthly',
  ANNUAL: 'annual'
})

export const BILLING_MODE = Object.freeze({
  PREPAID: 'prepaid',
  POSTPAID: 'postpaid'
})

export const ACCOUNT_MODE = Object.freeze({
  PLAN: 'plan',
  CUSTOM: 'custom'
})

export const PRORATION_BEHAVIOR = Object.freeze({
  CREATE_PRORATIONS: 'create_prorations',
  NONE: 'none',
  ALWAYS_INVOICE: 'always_invoice'
})

export const CHANGE_TIMING = Object.freeze({
  NOW: 'now',
  PERIOD_END: 'period_end'
})

export const SCHEDULED_CHANGE_TYPE = Object.freeze({
  CHANGE: 'change',
  CANCEL: 'cancel'
})

export const SCHEDULED_CHANGE_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  APPLIED: 'applied',
  CANCELLED: 'cancelled'
})
