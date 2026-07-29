import { describe, expect, it, vi } from 'vitest'
import {
  preparePaidSignupCheckout,
  submitSignupPlan
} from '@/composables/signup-checkout-preparation'

const plans = [
  { id: 'plan_hobby', sku: 'hobby', pricings: [] },
  {
    id: 'plan_pro',
    sku: 'pro',
    pricings: [
      { id: 'price_pro_monthly', periodicity: 'monthly' },
      { id: 'price_pro_yearly', periodicity: 'yearly' }
    ]
  }
]

const createResponse = (overrides = {}) => ({
  subscription: { id: 10, status: 'incomplete', serviceOrderId: 1 },
  payment: { clientSecret: 'seti_test_secret', gateway: 'stripe' },
  ...overrides
})

describe('preparePaidSignupCheckout', () => {
  it('creates the subscription and returns the first-payment client secret', async () => {
    const createSubscription = vi.fn().mockResolvedValue(createResponse())

    const result = await preparePaidSignupCheckout({
      plan: 'pro',
      billingCycle: 'monthly',
      plans,
      createSubscription
    })

    expect(createSubscription).toHaveBeenCalledWith({
      planId: 'plan_pro',
      planPricingId: 'price_pro_monthly'
    })
    expect(result.clientSecret).toBe('seti_test_secret')
    expect(result.subscription).toEqual({ id: 10, status: 'incomplete', serviceOrderId: 1 })
  })

  it('picks the pricing that matches the catalogue periodicity', async () => {
    const createSubscription = vi.fn().mockResolvedValue(createResponse())

    await preparePaidSignupCheckout({
      plan: 'pro',
      billingCycle: 'yearly',
      plans,
      createSubscription
    })

    expect(createSubscription).toHaveBeenCalledWith({
      planId: 'plan_pro',
      planPricingId: 'price_pro_yearly'
    })
  })

  it('does nothing for a free plan', async () => {
    const createSubscription = vi.fn()

    const result = await preparePaidSignupCheckout({
      plan: 'hobby',
      billingCycle: 'monthly',
      plans,
      createSubscription
    })

    expect(createSubscription).not.toHaveBeenCalled()
    expect(result).toEqual({ clientSecret: '', subscription: null })
  })

  it('throws when the response carries no client secret', async () => {
    const createSubscription = vi.fn().mockResolvedValue(createResponse({ payment: null }))

    await expect(
      preparePaidSignupCheckout({ plan: 'pro', billingCycle: 'monthly', plans, createSubscription })
    ).rejects.toThrow('Payment session client secret missing in response.')
  })

  it('throws when the paid plan is not in the catalogue', async () => {
    await expect(
      preparePaidSignupCheckout({
        plan: 'pro',
        billingCycle: 'monthly',
        plans: [{ id: 'plan_hobby', sku: 'hobby', pricings: [] }],
        createSubscription: vi.fn()
      })
    ).rejects.toThrow('Plan not found for pro.')
  })
})

describe('submitSignupPlan', () => {
  it('creates a free subscription without a payment leg', async () => {
    const createSubscription = vi
      .fn()
      .mockResolvedValue({ subscription: { id: 11, status: 'active' }, payment: null })

    const result = await submitSignupPlan({
      plan: 'hobby',
      billingCycle: 'monthly',
      plans,
      createSubscription
    })

    expect(createSubscription).toHaveBeenCalledWith({
      planId: 'plan_hobby',
      planPricingId: null
    })
    expect(result.payment).toBeNull()
    expect(result.subscription).toEqual({ id: 11, status: 'active' })
  })

  it('carries the client secret for a paid plan', async () => {
    const createSubscription = vi.fn().mockResolvedValue(createResponse())

    const result = await submitSignupPlan({
      plan: 'pro',
      billingCycle: 'yearly',
      plans,
      createSubscription
    })

    expect(createSubscription).toHaveBeenCalledWith({
      planId: 'plan_pro',
      planPricingId: 'price_pro_yearly'
    })
    expect(result.payment).toEqual({ clientSecret: 'seti_test_secret' })
  })
})
