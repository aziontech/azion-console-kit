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
  it('uses the British spelling cancelled for the terminal status', () => {
    expect(SUBSCRIPTION_STATUS.CANCELLED).toBe('cancelled')
    expect(SUBSCRIPTION_TERMINAL_STATUSES).toEqual(['cancelled'])
  })

  it('exposes the exact subscription status set', () => {
    expect(SUBSCRIPTION_STATUS).toEqual({
      INCOMPLETE: 'incomplete',
      ACTIVE: 'active',
      PAST_DUE: 'past_due',
      SUSPENDED: 'suspended',
      CANCELLED: 'cancelled'
    })
  })

  it('gates entitlement on active and past_due only', () => {
    expect(SUBSCRIPTION_ENTITLED_STATUSES).toEqual(['active', 'past_due'])
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
