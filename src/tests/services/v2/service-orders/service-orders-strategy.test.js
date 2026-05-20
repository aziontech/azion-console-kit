import { describe, expect, it } from 'vitest'
import {
  SUBMIT_ACTIONS,
  isDraftPatchable,
  resolveSubmitStrategy
} from '@/services/v2/service-orders/service-orders-strategy'
import { SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'

const draftWithinWindow = {
  status: SO_STATUS.DRAFT,
  createdAt: new Date().toISOString(),
  planId: 'plan-1',
  priceId: 'price-1'
}

const draftBeyondWindow = {
  status: SO_STATUS.DRAFT,
  createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  planId: 'plan-1',
  priceId: 'price-1'
}

const activeSO = {
  status: SO_STATUS.ACTIVE,
  createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  planId: 'plan-1',
  priceId: 'price-1'
}

describe('isDraftPatchable', () => {
  it('returns false when SO is missing', () => {
    expect(isDraftPatchable(null)).toBe(false)
    expect(isDraftPatchable(undefined)).toBe(false)
  })

  it('returns false when SO status is not DRAFT', () => {
    expect(isDraftPatchable(activeSO)).toBe(false)
  })

  it('returns true for a DRAFT created within 24h', () => {
    expect(isDraftPatchable(draftWithinWindow)).toBe(true)
  })

  it('returns false for a DRAFT created beyond 24h', () => {
    expect(isDraftPatchable(draftBeyondWindow)).toBe(false)
  })

  it('returns true for a DRAFT with no createdAt (cannot verify window)', () => {
    expect(isDraftPatchable({ status: SO_STATUS.DRAFT })).toBe(true)
  })
})

describe('resolveSubmitStrategy', () => {
  it('CREATE when there is no current SO', () => {
    const { action } = resolveSubmitStrategy({
      currentSO: null,
      planId: 'plan-1',
      planPricingId: 'price-1'
    })
    expect(action).toBe(SUBMIT_ACTIONS.CREATE)
  })

  it('PATCH when current SO is a DRAFT within the patch window', () => {
    const { action } = resolveSubmitStrategy({
      currentSO: draftWithinWindow,
      planId: 'plan-2',
      planPricingId: 'price-2'
    })
    expect(action).toBe(SUBMIT_ACTIONS.PATCH)
  })

  it('CREATE when current SO is a DRAFT but beyond the patch window', () => {
    const { action } = resolveSubmitStrategy({
      currentSO: draftBeyondWindow,
      planId: 'plan-2',
      planPricingId: 'price-2'
    })
    expect(action).toBe(SUBMIT_ACTIONS.CREATE)
  })

  it('UPGRADE when SO is ACTIVE and the plan changes', () => {
    const { action } = resolveSubmitStrategy({
      currentSO: activeSO,
      planId: 'plan-2',
      planPricingId: 'price-2'
    })
    expect(action).toBe(SUBMIT_ACTIONS.UPGRADE)
  })

  it('UPGRADE when SO is ACTIVE, same plan but different pricing (cycle change)', () => {
    const { action } = resolveSubmitStrategy({
      currentSO: activeSO,
      planId: 'plan-1',
      planPricingId: 'price-yearly'
    })
    expect(action).toBe(SUBMIT_ACTIONS.UPGRADE)
  })

  it('NOOP when SO is ACTIVE, same plan and same pricing', () => {
    const { action } = resolveSubmitStrategy({
      currentSO: activeSO,
      planId: 'plan-1',
      planPricingId: 'price-1'
    })
    expect(action).toBe(SUBMIT_ACTIONS.NOOP)
  })

  it('NOOP when SO is ACTIVE, same plan and no pricing provided', () => {
    const { action } = resolveSubmitStrategy({
      currentSO: activeSO,
      planId: 'plan-1'
    })
    expect(action).toBe(SUBMIT_ACTIONS.NOOP)
  })
})
