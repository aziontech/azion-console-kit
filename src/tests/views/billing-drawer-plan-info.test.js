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
        PricingCalculationBlock: { template: '<div />' },
        PaymentMethodBlock: { template: '<div />' },
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
  })
})
