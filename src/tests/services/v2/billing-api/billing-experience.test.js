import { describe, expect, it } from 'vitest'
import {
  BILLING_EXPERIENCE,
  resolveBillingExperience
} from '@/services/v2/billing-api/billing-experience'

describe('resolveBillingExperience', () => {
  it('defaults to the plans experience when nothing is known', () => {
    expect(resolveBillingExperience()).toBe(BILLING_EXPERIENCE.PLAN)
    expect(resolveBillingExperience({ billingType: null, accountMode: null })).toBe(
      BILLING_EXPERIENCE.PLAN
    )
  })

  it('keeps the managed experience carried by billing_type', () => {
    expect(resolveBillingExperience({ billingType: 'internal' })).toBe('internal')
    expect(resolveBillingExperience({ billingType: 'custom' })).toBe('custom')
  })

  it('keeps an unknown billing_type on the managed side', () => {
    expect(resolveBillingExperience({ billingType: 'something-new' })).toBe('something-new')
  })

  it('sends an account_mode=custom subscription to the managed experience', () => {
    expect(resolveBillingExperience({ billingType: 'plan', accountMode: 'custom' })).toBe('custom')
    expect(resolveBillingExperience({ billingType: null, accountMode: 'custom' })).toBe('custom')
  })

  it('keeps account_mode=plan on the plans experience', () => {
    expect(resolveBillingExperience({ billingType: null, accountMode: 'plan' })).toBe(
      BILLING_EXPERIENCE.PLAN
    )
  })

  it('keeps managed billing_type ahead of account_mode=plan while internal has no v4 equivalent', () => {
    expect(resolveBillingExperience({ billingType: 'internal', accountMode: 'plan' })).toBe(
      'internal'
    )
  })

  it('lets the local override win over account_mode', () => {
    expect(
      resolveBillingExperience({ billingType: 'plan', accountMode: 'custom', isOverridden: true })
    ).toBe(BILLING_EXPERIENCE.PLAN)
    expect(
      resolveBillingExperience({ billingType: null, accountMode: 'custom', isOverridden: true })
    ).toBe(BILLING_EXPERIENCE.PLAN)
  })
})
