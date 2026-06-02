import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import DrawerPlanInfo from '@/views/Billing/Drawer/DrawerPlanInfo.vue'

vi.mock('@aziontech/webkit/sidebar', () => ({
  default: {
    props: ['visible'],
    template: '<aside v-if="visible"><slot /></aside>'
  }
}))

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: vi.fn() })
}))

vi.mock('@/composables/usePlans', () => ({
  usePlans: () => ({ setParam: vi.fn() })
}))

vi.mock('@/composables/useBillingPaymentMethods', () => ({
  useBillingPaymentMethods: () => ({ defaultPaymentMethod: { value: null } })
}))

vi.mock('@/composables/useUpdateDefaultPaymentMethod', () => ({
  useUpdateDefaultPaymentMethod: () => ({
    createSetupIntent: vi.fn(),
    setDefault: vi.fn()
  })
}))

const mountDrawer = (props = {}) =>
  mount(DrawerPlanInfo, {
    props: {
      visible: true,
      plan: 'pro',
      mode: 'subscribe',
      getStripeClientService: vi.fn(),
      ...props
    },
    global: {
      stubs: {
        CheckoutFeaturesBlock: { template: '<div />' },
        PricingCalculationBlock: {
          name: 'PricingCalculationBlock',
          props: ['disabled'],
          emits: ['update:billingCycle', 'update:checkoutSessionClientSecret'],
          template: '<div />'
        },
        PaymentMethodBlock: {
          props: ['checkoutSessionClientSecret'],
          template: '<div data-testid="checkout-secret">{{ checkoutSessionClientSecret }}</div>'
        },
        PaymentMethodSetupBlock: { template: '<div />' },
        PaymentMethodSummary: { template: '<div />' },
        AddressInformationBlock: { template: '<div />' },
        CheckoutSubmissionFooter: {
          props: ['submitLabel', 'isSubmitting', 'isConfirmDisabled'],
          emits: ['confirm', 'cancel'],
          template: `
            <button
              data-testid="confirm"
              :disabled="isConfirmDisabled"
              @click="$emit('confirm')"
            >
              {{ submitLabel }}
            </button>
          `
        }
      }
    }
  })

const flushPromises = () => Promise.resolve().then(() => Promise.resolve())

describe('DrawerPlanInfo', () => {
  it('starts billing checkout preparation from an explicit confirm click', async () => {
    const wrapper = mountDrawer({ initialClientSecret: '' })
    const confirm = wrapper.get('[data-testid="confirm"]')

    expect(confirm.element.disabled).toBe(false)

    await confirm.trigger('click')

    expect(wrapper.emitted('prepareCheckoutSession')).toHaveLength(1)
    expect(wrapper.emitted('prepareCheckoutSession')[0][0]).toMatchObject({
      plan: 'pro',
      billingCycle: 'yearly'
    })

    wrapper.emitted('prepareCheckoutSession')[0][0].done('cs_yearly')
    await flushPromises()
  })

  it('keeps pricing cycle locked while checkout preparation is in flight', async () => {
    const wrapper = mountDrawer({ initialClientSecret: '' })
    const confirm = wrapper.get('[data-testid="confirm"]')

    await confirm.trigger('click')

    expect(wrapper.findComponent({ name: 'PricingCalculationBlock' }).props('disabled')).toBe(true)

    wrapper.emitted('prepareCheckoutSession')[0][0].done('cs_yearly')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'PricingCalculationBlock' }).props('disabled')).toBe(false)
  })

  it('discards a prepared checkout session when the billing cycle changes before it resolves', async () => {
    const wrapper = mountDrawer({ initialClientSecret: '' })
    const pricing = wrapper.findComponent({ name: 'PricingCalculationBlock' })

    await wrapper.get('[data-testid="confirm"]').trigger('click')

    const prepareEvent = wrapper.emitted('prepareCheckoutSession')[0][0]
    pricing.vm.$emit('update:billingCycle', 'monthly')
    pricing.vm.$emit('update:checkoutSessionClientSecret', '')
    prepareEvent.done('cs_yearly')
    await flushPromises()

    expect(wrapper.get('[data-testid="confirm"]').text()).toBe('Continue')
    expect(wrapper.get('[data-testid="checkout-secret"]').text()).toBe('')
  })
})
