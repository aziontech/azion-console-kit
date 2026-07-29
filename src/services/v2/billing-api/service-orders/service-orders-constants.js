export const SERVICE_ORDER_TYPE = Object.freeze({
  SUPPORT: 'support',
  MISSION_CRITICAL: 'mission_critical',
  SAVING_PLAN: 'saving_plan',
  RESERVE_CAPACITY: 'reserve_capacity',
  MARKETPLACE: 'marketplace',
  INTEGRATION_SERVICE: 'integration_service',
  CUSTOM_TERMS: 'custom_terms'
})

export const SERVICE_ORDER_STATUS = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
})

export const SERVICE_ORDER_TERMINAL_STATUSES = Object.freeze([
  SERVICE_ORDER_STATUS.CANCELLED,
  SERVICE_ORDER_STATUS.EXPIRED
])

export const ORDER_ACTION_TYPE = Object.freeze({
  CREATE: 'create',
  CHANGE: 'change',
  RENEW: 'renew',
  CANCEL: 'cancel',
  COMMITMENT_CHANGE: 'commitment_change'
})

export const ORDER_ACTION_STATUS = Object.freeze({
  DRAFT: 'draft',
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
})

export const SERVICE_ORDER_PERIOD = Object.freeze({
  MONTHLY: 'monthly',
  ANNUAL: 'annual'
})

export const SERVICE_ORDER_BILLING_MODE = Object.freeze({
  PREPAID: 'prepaid',
  POSTPAID: 'postpaid'
})
