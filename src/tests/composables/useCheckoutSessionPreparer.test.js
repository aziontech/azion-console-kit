import { describe, expect, it, vi } from 'vitest'
import { prepareCheckoutSessionForServiceOrder } from '@/composables/useCheckoutSessionPreparer'

const plans = [
  {
    id: 'plan_pro',
    sku: 'pro',
    pricings: [
      { id: 'price_pro_monthly', periodicity: 'monthly' },
      { id: 'price_pro_yearly', periodicity: 'yearly' }
    ]
  }
]

describe('useCheckoutSessionPreparer', () => {
  it('patches a known DRAFT service order directly when changing cycle', async () => {
    const ensureServiceOrdersList = vi.fn()
    const updateServiceOrder = vi.fn().mockResolvedValue({
      payment: { clientSecret: 'cs_yearly' }
    })

    const secret = await prepareCheckoutSessionForServiceOrder({
      accountId: 123,
      plan: 'pro',
      cycle: 'yearly',
      plans,
      draftServiceOrderId: 'so_draft',
      ensureServiceOrdersList,
      getCurrentServiceOrder: vi.fn(),
      createServiceOrder: vi.fn(),
      prepareSignupCheckout: vi.fn(),
      updateServiceOrder,
      upgrade: vi.fn()
    })

    expect(ensureServiceOrdersList).not.toHaveBeenCalled()
    expect(updateServiceOrder).toHaveBeenCalledWith('so_draft', {
      planId: 'plan_pro',
      planPricingId: 'price_pro_yearly'
    })
    expect(secret).toBe('cs_yearly')
  })

  it('uses signup checkout prepare without loading service orders for signup', async () => {
    const ensureServiceOrdersList = vi.fn()
    const prepareSignupCheckout = vi.fn().mockResolvedValue({
      payment: { clientSecret: 'cs_signup_yearly' }
    })

    const secret = await prepareCheckoutSessionForServiceOrder({
      accountId: 123,
      plan: 'pro',
      cycle: 'yearly',
      plans,
      draftServiceOrderId: 'so_draft',
      signup: true,
      ensureServiceOrdersList,
      getCurrentServiceOrder: vi.fn(),
      createServiceOrder: vi.fn(),
      prepareSignupCheckout,
      updateServiceOrder: vi.fn(),
      upgrade: vi.fn()
    })

    expect(ensureServiceOrdersList).not.toHaveBeenCalled()
    expect(prepareSignupCheckout).toHaveBeenCalledWith({
      planId: 'plan_pro',
      planPricingId: 'price_pro_yearly'
    })
    expect(secret).toBe('cs_signup_yearly')
  })
})
