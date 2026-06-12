export const SO_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  BLOCKED: 'BLOCKED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED'
})

export const SO_ENTITLED_STATUSES = Object.freeze([
  SO_STATUS.ACTIVE,
  SO_STATUS.PAST_DUE,
  SO_STATUS.BLOCKED
])

export const SO_TERMINAL_STATUSES = Object.freeze([SO_STATUS.CANCELED, SO_STATUS.EXPIRED])

export const SO_MESSAGES = Object.freeze({
  MISSING_SERVICE_ORDER_ID: 'Service order id is required to change plan'
})

export const PATCH_DRAFT_WINDOW_MS = 24 * 60 * 60 * 1000
