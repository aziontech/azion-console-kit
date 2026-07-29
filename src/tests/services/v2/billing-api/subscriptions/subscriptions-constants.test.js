import { describe, expect, it } from 'vitest'
import {
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_ENTITLED_STATUSES,
  SUBSCRIPTION_TERMINAL_STATUSES,
  BILLING_PERIOD,
  BILLING_MODE,
  PRORATION_BEHAVIOR,
  CHANGE_TIMING,
  SCHEDULED_CHANGE_TYPE,
  SCHEDULED_CHANGE_STATUS
} from '@/services/v2/billing-api/subscriptions/subscriptions-constants'

describe('subscriptions constants mirror the v4 contract enums', () => {
  it('uses the single-l CANCELED spelling and treats EXPIRED as terminal too', () => {
    expect(SUBSCRIPTION_STATUS.CANCELED).toBe('CANCELED')
    expect(SUBSCRIPTION_STATUS.CANCELLED).toBeUndefined()
    expect(SUBSCRIPTION_TERMINAL_STATUSES).toEqual(['CANCELED', 'EXPIRED'])
  })

  it('exposes the exact uppercase subscription status set', () => {
    expect(SUBSCRIPTION_STATUS).toEqual({
      DRAFT: 'DRAFT',
      ACTIVE: 'ACTIVE',
      PAST_DUE: 'PAST_DUE',
      BLOCKED: 'BLOCKED',
      CANCELED: 'CANCELED',
      EXPIRED: 'EXPIRED'
    })
  })

  it('gates entitlement on ACTIVE and PAST_DUE only', () => {
    expect(SUBSCRIPTION_ENTITLED_STATUSES).toEqual(['ACTIVE', 'PAST_DUE'])
  })

  it('uses annual (not yearly) for the yearly period', () => {
    expect(BILLING_PERIOD).toEqual({ MONTHLY: 'monthly', ANNUAL: 'annual' })
  })

  it('mirrors billing mode, proration, timing and scheduled-change enums', () => {
    expect(BILLING_MODE).toEqual({ PREPAID: 'prepaid', POSTPAID: 'postpaid' })
    expect(PRORATION_BEHAVIOR).toEqual({
      CREATE_PRORATIONS: 'create_prorations',
      NONE: 'none',
      ALWAYS_INVOICE: 'always_invoice'
    })
    expect(CHANGE_TIMING).toEqual({ NOW: 'now', PERIOD_END: 'period_end' })
    expect(SCHEDULED_CHANGE_TYPE).toEqual({ CHANGE: 'change', CANCEL: 'cancel' })
    expect(SCHEDULED_CHANGE_STATUS).toEqual({
      SCHEDULED: 'scheduled',
      APPLIED: 'applied',
      CANCELLED: 'cancelled'
    })
  })
})
