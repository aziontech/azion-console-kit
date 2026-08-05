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
  SCHEDULED_CHANGE_STATUS,
  normalizeSubscriptionStatus,
  isEntitledStatus,
  isTerminalStatus,
  isCheckoutPendingStatus,
  isSuspendedStatus
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

describe('normalizeSubscriptionStatus bridges the UPPERCASE read DTO and the lowercase spec enum', () => {
  it('keeps the uppercase statuses the API returns today', () => {
    expect(normalizeSubscriptionStatus('DRAFT')).toBe('DRAFT')
    expect(normalizeSubscriptionStatus('ACTIVE')).toBe('ACTIVE')
    expect(normalizeSubscriptionStatus('PAST_DUE')).toBe('PAST_DUE')
    expect(normalizeSubscriptionStatus('BLOCKED')).toBe('BLOCKED')
    expect(normalizeSubscriptionStatus('CANCELED')).toBe('CANCELED')
    expect(normalizeSubscriptionStatus('EXPIRED')).toBe('EXPIRED')
  })

  it('maps the lowercase spec enum onto the same canonical set', () => {
    expect(normalizeSubscriptionStatus('incomplete')).toBe('DRAFT')
    expect(normalizeSubscriptionStatus('active')).toBe('ACTIVE')
    expect(normalizeSubscriptionStatus('past_due')).toBe('PAST_DUE')
    expect(normalizeSubscriptionStatus('suspended')).toBe('BLOCKED')
    expect(normalizeSubscriptionStatus('cancelled')).toBe('CANCELED')
    expect(normalizeSubscriptionStatus('expired')).toBe('EXPIRED')
  })

  it('tolerates the double-l cancelled spelling in either case', () => {
    expect(normalizeSubscriptionStatus('CANCELLED')).toBe('CANCELED')
    expect(normalizeSubscriptionStatus('canceled')).toBe('CANCELED')
  })

  it('returns null for an absent status and passes an unknown one through uppercased', () => {
    expect(normalizeSubscriptionStatus(null)).toBeNull()
    expect(normalizeSubscriptionStatus(undefined)).toBeNull()
    expect(normalizeSubscriptionStatus('')).toBeNull()
    expect(normalizeSubscriptionStatus('something_new')).toBe('SOMETHING_NEW')
  })

  it('answers the entitlement questions in both formats', () => {
    expect(isEntitledStatus('ACTIVE')).toBe(true)
    expect(isEntitledStatus('past_due')).toBe(true)
    expect(isEntitledStatus('DRAFT')).toBe(false)
    expect(isEntitledStatus('suspended')).toBe(false)

    expect(isTerminalStatus('cancelled')).toBe(true)
    expect(isTerminalStatus('EXPIRED')).toBe(true)
    expect(isTerminalStatus('ACTIVE')).toBe(false)

    expect(isCheckoutPendingStatus('DRAFT')).toBe(true)
    expect(isCheckoutPendingStatus('incomplete')).toBe(true)
    expect(isCheckoutPendingStatus('ACTIVE')).toBe(false)

    expect(isSuspendedStatus('BLOCKED')).toBe(true)
    expect(isSuspendedStatus('suspended')).toBe(true)
    expect(isSuspendedStatus('PAST_DUE')).toBe(false)
  })
})
