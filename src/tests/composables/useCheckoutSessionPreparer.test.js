import { describe, expect, it, vi } from 'vitest'
import { prepareCheckoutSessionForSubscription } from '@/composables/useCheckoutSessionPreparer'

const plans = [
  { id: 'plan_hobby', sku: 'hobby', pricings: [{ id: 'price_hobby', periodicity: 'monthly' }] },
  {
    id: 'plan_pro',
    sku: 'pro',
    pricings: [
      { id: 'price_pro_monthly', periodicity: 'monthly' },
      { id: 'price_pro_yearly', periodicity: 'yearly' }
    ]
  }
]

const noSubscription = () => Promise.resolve({ data: null })
const activeSubscription = () =>
  Promise.resolve({ data: { id: 10, serviceOrderId: 1, status: 'active' } })

describe('prepareCheckoutSessionForSubscription', () => {
  it('creates the subscription when the account has none, and returns its client secret', async () => {
    const createSubscription = vi.fn().mockResolvedValue({
      subscription: { id: 10, status: 'incomplete' },
      payment: { clientSecret: 'seti_first_payment' }
    })
    const createCardSetupSession = vi.fn()

    const secret = await prepareCheckoutSessionForSubscription({
      plan: 'pro',
      cycle: 'monthly',
      plans,
      ensureSubscription: noSubscription,
      createSubscription,
      createCardSetupSession
    })

    expect(createSubscription).toHaveBeenCalledWith({
      planId: 'plan_pro',
      planPricingId: 'price_pro_monthly'
    })
    expect(createCardSetupSession).not.toHaveBeenCalled()
    expect(secret).toBe('seti_first_payment')
  })

  it('captures a card instead of creating a subscription when one is already active', async () => {
    const createSubscription = vi.fn()
    const createCardSetupSession = vi.fn().mockResolvedValue({ clientSecret: 'seti_setup' })

    const secret = await prepareCheckoutSessionForSubscription({
      plan: 'pro',
      cycle: 'yearly',
      plans,
      ensureSubscription: activeSubscription,
      createSubscription,
      createCardSetupSession
    })

    expect(createCardSetupSession).toHaveBeenCalledOnce()
    expect(createSubscription).not.toHaveBeenCalled()
    expect(secret).toBe('seti_setup')
  })

  it('accepts the enveloped setup-session shape', async () => {
    const secret = await prepareCheckoutSessionForSubscription({
      plan: 'pro',
      cycle: 'monthly',
      plans,
      ensureSubscription: activeSubscription,
      createSubscription: vi.fn(),
      createCardSetupSession: vi.fn().mockResolvedValue({ data: { clientSecret: 'seti_env' } })
    })

    expect(secret).toBe('seti_env')
  })

  it('creates a new subscription after a CANCELED one', async () => {
    const createSubscription = vi.fn().mockResolvedValue({
      subscription: { id: 11, status: 'incomplete' },
      payment: { clientSecret: 'seti_resubscribe' }
    })

    const secret = await prepareCheckoutSessionForSubscription({
      plan: 'pro',
      cycle: 'monthly',
      plans,
      ensureSubscription: () => Promise.resolve({ data: { id: 10, status: 'CANCELED' } }),
      createSubscription,
      createCardSetupSession: vi.fn()
    })

    expect(createSubscription).toHaveBeenCalledOnce()
    expect(secret).toBe('seti_resubscribe')
  })

  it('sends the pricing id that matches the chosen cycle', async () => {
    const createSubscription = vi.fn().mockResolvedValue({
      subscription: { id: 12 },
      payment: { clientSecret: 'seti_annual' }
    })

    await prepareCheckoutSessionForSubscription({
      plan: 'pro',
      cycle: 'yearly',
      plans,
      ensureSubscription: noSubscription,
      createSubscription,
      createCardSetupSession: vi.fn()
    })

    expect(createSubscription).toHaveBeenCalledWith({
      planId: 'plan_pro',
      planPricingId: 'price_pro_yearly'
    })
  })

  it('throws when the plan cannot be resolved in the catalogue', async () => {
    await expect(
      prepareCheckoutSessionForSubscription({
        plan: 'enterprise',
        cycle: 'monthly',
        plans,
        ensureSubscription: noSubscription,
        createSubscription: vi.fn(),
        createCardSetupSession: vi.fn()
      })
    ).rejects.toThrow('Plan pricing not found for enterprise (monthly).')
  })

  it('throws when the created subscription carries no client secret', async () => {
    await expect(
      prepareCheckoutSessionForSubscription({
        plan: 'pro',
        cycle: 'monthly',
        plans,
        ensureSubscription: noSubscription,
        createSubscription: vi.fn().mockResolvedValue({ subscription: { id: 1 }, payment: null }),
        createCardSetupSession: vi.fn()
      })
    ).rejects.toThrow('Payment session client secret missing in response.')
  })
})
