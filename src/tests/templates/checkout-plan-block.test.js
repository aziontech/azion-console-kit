import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import CheckoutPlanBlock from '@/templates/checkout-block/checkout-plan-block.vue'

const mocks = vi.hoisted(() => ({
  toastAdd: vi.fn()
}))

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: mocks.toastAdd })
}))

vi.mock('@/composables/useScrollToError', () => ({
  useScrollToError: () => ({ scrollToError: vi.fn() })
}))

const mountCheckoutPlanBlock = ({
  paymentErrors = null,
  confirmCheckoutSession = vi.fn(),
  saveAddress = vi.fn(),
  emitPaymentReady = false,
  emitAddressReady = false
} = {}) =>
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
        PaymentMethodBlock: defineComponent({
          template: `
            <button
              data-testid="stale-session"
              @click="$emit('stale-session', { reason: 'no_such_checkout_session' })"
            />
          `,
          emits: ['readiness-change', 'element-ready', 'stale-session'],
          mounted() {
            if (emitPaymentReady) this.$emit('readiness-change', true)
          },
          methods: {
            validate: vi.fn().mockResolvedValue(paymentErrors),
            confirmCheckoutSession
          }
        }),
        AddressInformationBlock: defineComponent({
          template: '<div />',
          emits: ['readiness-change'],
          mounted() {
            if (emitAddressReady) this.$emit('readiness-change', true)
          },
          methods: {
            saveAddress,
            getCountry: vi.fn(() => 'United States')
          }
        }),
        CheckoutActionFooter: {
          template: '<button data-testid="submit" @click="$emit(\'submit\')" />',
          emits: ['submit']
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

  it('recovers stale Stripe checkout sessions detected during submit', async () => {
    const confirmCheckoutSession = vi
      .fn()
      .mockRejectedValue(new Error("No such checkout.session: 'cs_test_stale'"))
    const saveAddress = vi.fn().mockResolvedValue({
      postalCode: '12345',
      country: 1,
      region: 'CA',
      city: 'San Francisco',
      address: 'Market St',
      complement: ''
    })
    const wrapper = mountCheckoutPlanBlock({
      confirmCheckoutSession,
      saveAddress,
      emitPaymentReady: true,
      emitAddressReady: true
    })

    await flushPromises()
    await wrapper.get('[data-testid="submit"]').trigger('click')
    await flushPromises()

    expect(saveAddress).toHaveBeenCalledTimes(1)
    expect(confirmCheckoutSession).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('stale-session')).toEqual([
      [
        {
          reason: 'no_such_checkout_session',
          plan: 'pro',
          billingCycle: 'monthly'
        }
      ]
    ])
    expect(mocks.toastAdd).not.toHaveBeenCalled()
  })
})
