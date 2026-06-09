import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import CheckoutPlanBlock from '@/templates/checkout-block/checkout-plan-block.vue'

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: vi.fn() })
}))

vi.mock('@/composables/useScrollToError', () => ({
  useScrollToError: () => ({ scrollToError: vi.fn() })
}))

const mountCheckoutPlanBlock = () =>
  mount(CheckoutPlanBlock, {
    props: {
      plan: 'pro',
      getStripeClientService: vi.fn(),
      checkoutSessionClientSecret: 'cs_test'
    },
    global: {
      stubs: {
        PricingCalculationBlock: {
          template: `
            <button
              data-testid="prepared-session"
              @click="
                $emit('update:billing-cycle', 'yearly');
                $emit('update:checkout-session-client-secret', 'cs_yearly')
              "
            />
          `,
          emits: ['update:billing-cycle', 'update:checkout-session-client-secret']
        },
        PaymentMethodBlock: {
          template: `
            <button
              data-testid="stale-session"
              @click="$emit('stale-session', { reason: 'no_such_checkout_session' })"
            />
          `,
          emits: ['readiness-change', 'element-ready', 'stale-session']
        },
        AddressInformationBlock: {
          template: '<div />',
          emits: ['readiness-change']
        },
        CheckoutActionFooter: {
          template: '<div />'
        }
      }
    }
  })

describe('checkout-plan-block', () => {
  it('propagates stale Stripe checkout sessions with current plan and cycle', async () => {
    const wrapper = mountCheckoutPlanBlock()

    await wrapper.get('[data-testid="stale-session"]').trigger('click')

    expect(wrapper.emitted('stale-session')).toEqual([
      [
        {
          reason: 'no_such_checkout_session',
          plan: 'pro',
          billingCycle: 'monthly'
        }
      ]
    ])
  })

  it('propagates prepared checkout sessions with current cycle', async () => {
    const wrapper = mountCheckoutPlanBlock()

    await wrapper.get('[data-testid="prepared-session"]').trigger('click')

    expect(wrapper.emitted('checkout-session-prepared')).toEqual([
      [
        {
          clientSecret: 'cs_yearly',
          billingCycle: 'yearly'
        }
      ]
    ])
  })
})
