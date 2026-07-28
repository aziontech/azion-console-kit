import { describe, expect, it } from 'vitest'
import { pickPendingChange, pickPendingCancellation } from '@/composables/useSubscriptionPlanChange'
import {
  SCHEDULED_CHANGE_STATUS,
  SCHEDULED_CHANGE_TYPE
} from '@/services/v2/billing-api/subscriptions/subscriptions-constants'

const scheduledChange = (overrides = {}) => ({
  id: 7,
  subscriptionId: 1,
  type: SCHEDULED_CHANGE_TYPE.CHANGE,
  status: SCHEDULED_CHANGE_STATUS.SCHEDULED,
  effectiveAt: '2026-08-31T00:00:00.000Z',
  change: { planId: 4, period: 'monthly' },
  ...overrides
})

describe('pickPendingChange', () => {
  it('returns the scheduled plan change', () => {
    const pending = pickPendingChange({ results: [scheduledChange()] })
    expect(pending.id).toBe(7)
    expect(pending.change).toEqual({ planId: 4, period: 'monthly' })
  })

  it('ignores changes that were already applied or cancelled', () => {
    const results = [
      scheduledChange({ id: 1, status: SCHEDULED_CHANGE_STATUS.APPLIED }),
      scheduledChange({ id: 2, status: SCHEDULED_CHANGE_STATUS.CANCELLED })
    ]
    expect(pickPendingChange({ results })).toBeNull()
  })

  it('ignores a scheduled cancellation', () => {
    const results = [scheduledChange({ type: SCHEDULED_CHANGE_TYPE.CANCEL })]
    expect(pickPendingChange({ results })).toBeNull()
  })

  it('tolerates an empty, missing or unavailable payload', () => {
    expect(pickPendingChange({ results: [] })).toBeNull()
    expect(pickPendingChange({})).toBeNull()
    expect(pickPendingChange(null)).toBeNull()
    expect(pickPendingChange({ results: [], unavailable: true })).toBeNull()
  })
})

describe('pickPendingCancellation', () => {
  it('returns only a scheduled cancellation', () => {
    const results = [
      scheduledChange({ id: 9, type: SCHEDULED_CHANGE_TYPE.CANCEL, change: null }),
      scheduledChange({ id: 10 })
    ]
    expect(pickPendingCancellation({ results }).id).toBe(9)
  })

  it('is null when only a plan change is scheduled', () => {
    expect(pickPendingCancellation({ results: [scheduledChange()] })).toBeNull()
  })
})
