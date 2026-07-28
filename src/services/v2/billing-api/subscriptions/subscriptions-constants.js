export const SUBSCRIPTION_STATUS = Object.freeze({
  INCOMPLETE: 'incomplete',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled'
})

export const SUBSCRIPTION_ENTITLED_STATUSES = Object.freeze([
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.PAST_DUE
])

export const SUBSCRIPTION_TERMINAL_STATUSES = Object.freeze([SUBSCRIPTION_STATUS.CANCELLED])

export const BILLING_PERIOD = Object.freeze({
  MONTHLY: 'monthly',
  ANNUAL: 'annual'
})

export const BILLING_MODE = Object.freeze({
  PREPAID: 'prepaid',
  POSTPAID: 'postpaid'
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
