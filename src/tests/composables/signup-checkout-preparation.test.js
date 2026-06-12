import { describe, expect, it, vi } from 'vitest'
import {
  preparePaidSignupCheckout,
  submitSignupPlanFromDraftOrCreate
} from '@/composables/signup-checkout-preparation'

const plans = [
  {
    id: 'plan_hobby',
    sku: 'hobby',
    pricings: []
  },
  {
    id: 'plan_pro',
    sku: 'pro',
    pricings: [
      { id: 'price_pro_monthly', periodicity: 'monthly' },
      { id: 'price_pro_yearly', periodicity: 'yearly' }
    ]
  }
]

describe('signup-checkout-preparation', () => {
  it('prepares a paid signup checkout through the dedicated endpoint', async () => {
    const prepareSignupCheckout = vi.fn().mockResolvedValue({
      data: { serviceOrderId: 'so_draft' },
      payment: { clientSecret: 'cs_test_secret' }
    })

    const result = await preparePaidSignupCheckout({
      accountId: 123,
      plan: 'pro',
      billingCycle: 'monthly',
      plans,
      prepareSignupCheckout
    })

    expect(prepareSignupCheckout).toHaveBeenCalledWith({
      planId: 'plan_pro',
      planPricingId: 'price_pro_monthly'
    })
    expect(result).toEqual({
      clientSecret: 'cs_test_secret',
      draftServiceOrderId: 'so_draft',
      serviceOrder: { serviceOrderId: 'so_draft' }
    })
  })

  it('lets the API reuse an existing DRAFT when preparing another paid cycle', async () => {
    const prepareSignupCheckout = vi.fn().mockResolvedValue({
      data: { serviceOrderId: 'so_existing' },
      payment: { clientSecret: 'cs_next_secret' }
    })

    const result = await preparePaidSignupCheckout({
      accountId: 123,
      plan: 'pro',
      billingCycle: 'yearly',
      plans,
      prepareSignupCheckout
    })

    expect(prepareSignupCheckout).toHaveBeenCalledWith({
      planId: 'plan_pro',
      planPricingId: 'price_pro_yearly'
    })
    expect(result.clientSecret).toBe('cs_next_secret')
    expect(result.draftServiceOrderId).toBe('so_existing')
  })

  it('activates Hobby through the signup prepare endpoint only when Hobby is submitted', async () => {
    const prepareSignupCheckout = vi.fn().mockResolvedValue({
      data: { serviceOrderId: 'so_existing', status: 'ACTIVE', planId: 'plan_hobby' }
    })

    const result = await submitSignupPlanFromDraftOrCreate({
      accountId: 123,
      plan: 'hobby',
      billingCycle: 'monthly',
      plans,
      prepareSignupCheckout
    })

    expect(prepareSignupCheckout).toHaveBeenCalledWith({
      planId: 'plan_hobby'
    })
    expect(result.payment).toBeNull()
    expect(result.serviceOrder).toEqual({
      serviceOrderId: 'so_existing',
      status: 'ACTIVE',
      planId: 'plan_hobby'
    })
  })
})
