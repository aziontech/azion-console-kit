export const SO_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  BLOCKED: 'BLOCKED'
})

export const SO_MESSAGES = Object.freeze({
  MISSING_SERVICE_ORDER_ID: 'Service order id is required to change plan'
})

export const PATCH_DRAFT_WINDOW_MS = 24 * 60 * 60 * 1000
