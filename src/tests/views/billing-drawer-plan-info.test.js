import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const { walletState, walletMutations, toastAdd, stubBlock } = vi.hoisted(() => ({
  walletState: { setCard: () => {} },
  walletMutations: {
    createSetupIntent: vi.fn(async () => ({ clientSecret: 'seti_minted_secret_123' })),
    setDefault: vi.fn(async () => ({})),
    waitForPaymentMethod: vi.fn(async () => ({ id: 'pm_new' }))
  },
  toastAdd: vi.fn(),
  stubBlock: (name, props = []) => ({
    default: { name, props, template: '<div />' }
  })
}))

vi.mock('@/composables/billing/useWallet', async () => {
  const { ref } = await import('vue')
  const card = ref(null)
  walletState.setCard = (value) => {
    card.value = value
  }
  return {
    useWallet: () => ({ defaultPaymentMethod: card }),
    useWalletMutations: () => ({
      createSetupIntent: walletMutations.createSetupIntent,
      setDefault: walletMutations.setDefault
    }),
    waitForPaymentMethod: walletMutations.waitForPaymentMethod
  }
})

vi.mock('@/composables/usePlans', () => ({
  usePlans: () => ({ setParam: vi.fn() })
}))

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: toastAdd })
}))

vi.mock('@aziontech/webkit/sidebar', () => ({
  default: { name: 'Sidebar', template: '<div><slot /></div>' }
}))
vi.mock('@/templates/checkout-block/checkout-features-block.vue', () =>
  stubBlock('CheckoutFeaturesBlock')
)
vi.mock('@/templates/checkout-block/pricing-calculation-block.vue', () =>
  stubBlock('PricingCalculationBlock')
)
vi.mock('@/templates/checkout-block/payment-method-block.vue', () =>
  stubBlock('PaymentMethodBlock', ['checkoutSessionClientSecret'])
)
vi.mock('@/templates/checkout-block/payment-method-setup-block.vue', () =>
  stubBlock('PaymentMethodSetupBlock', ['clientSecret', 'showCancel'])
)
vi.mock('@/templates/checkout-block/address-information-block.vue', () =>
  stubBlock('AddressInformationBlock')
)
vi.mock('@/templates/checkout-block/terms-acceptance-block.vue', () =>
  stubBlock('TermsAcceptanceBlock', ['modelValue'])
)
vi.mock('@/views/Billing/Drawer/blocks/PaymentMethodSummary.vue', () =>
  stubBlock('PaymentMethodSummary', ['card'])
)
vi.mock('@/views/Billing/Drawer/CheckoutSubmissionFooter.vue', () =>
  stubBlock('CheckoutSubmissionFooter', ['submitLabel', 'isSubmitting', 'isConfirmDisabled'])
)

import DrawerPlanInfo from '@/views/Billing/Drawer/DrawerPlanInfo.vue'

const flush = async () => {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

const mountDrawer = (props = {}) =>
  mount(DrawerPlanInfo, {
    props: {
      visible: true,
      plan: 'pro',
      ...props
    }
  })

const findByName = (wrapper, name) => wrapper.findComponent({ name })

describe('DrawerPlanInfo — card capture for entitled subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    walletState.setCard(null)
  })

  it('auto-mints a setup intent in change-cycle mode when there is no default card', async () => {
    const wrapper = mountDrawer({ mode: 'change-cycle', lockedCycle: 'yearly' })
    await flush()

    expect(walletMutations.createSetupIntent).toHaveBeenCalledOnce()
    const setupBlock = findByName(wrapper, 'PaymentMethodSetupBlock')
    expect(setupBlock.exists()).toBe(true)
    expect(setupBlock.props('clientSecret')).toBe('seti_minted_secret_123')
    expect(setupBlock.props('showCancel')).toBe(false)
  })

  it('adopts a prepared seti_ secret in subscribe mode instead of the checkout element', async () => {
    const wrapper = mountDrawer({
      mode: 'subscribe',
      initialClientSecret: 'seti_prepared_secret_456'
    })
    await flush()

    expect(walletMutations.createSetupIntent).not.toHaveBeenCalled()
    const setupBlock = findByName(wrapper, 'PaymentMethodSetupBlock')
    expect(setupBlock.exists()).toBe(true)
    expect(setupBlock.props('clientSecret')).toBe('seti_prepared_secret_456')
    expect(findByName(wrapper, 'PaymentMethodBlock').exists()).toBe(false)
    expect(findByName(wrapper, 'AddressInformationBlock').exists()).toBe(false)
  })

  it('keeps the checkout-session element for a cs_ first-payment secret', async () => {
    const wrapper = mountDrawer({
      mode: 'subscribe',
      initialClientSecret: 'cs_test_secret_789'
    })
    await flush()

    expect(walletMutations.createSetupIntent).not.toHaveBeenCalled()
    expect(findByName(wrapper, 'PaymentMethodSetupBlock').exists()).toBe(false)
    expect(findByName(wrapper, 'PaymentMethodBlock').exists()).toBe(true)
    expect(findByName(wrapper, 'AddressInformationBlock').exists()).toBe(true)
  })

  it('shows the default card summary and no capture block when a default card exists', async () => {
    walletState.setCard({ id: 'pm_default', brand: 'visa', last4: '4242' })
    const wrapper = mountDrawer({
      mode: 'subscribe',
      initialClientSecret: 'seti_prepared_secret_456'
    })
    await flush()

    expect(findByName(wrapper, 'PaymentMethodSummary').exists()).toBe(true)
    expect(findByName(wrapper, 'PaymentMethodSetupBlock').exists()).toBe(false)
    expect(walletMutations.createSetupIntent).not.toHaveBeenCalled()
  })

  it('mints a fresh setup intent when swapping away from the default card in change-cycle mode', async () => {
    walletState.setCard({ id: 'pm_default', brand: 'visa', last4: '4242' })
    const wrapper = mountDrawer({ mode: 'change-cycle', lockedCycle: 'yearly' })
    await flush()
    expect(walletMutations.createSetupIntent).not.toHaveBeenCalled()

    findByName(wrapper, 'PaymentMethodSummary').vm.$emit('swap')
    await flush()

    expect(walletMutations.createSetupIntent).toHaveBeenCalledOnce()
    const setupBlock = findByName(wrapper, 'PaymentMethodSetupBlock')
    expect(setupBlock.props('clientSecret')).toBe('seti_minted_secret_123')
    expect(setupBlock.props('showCancel')).toBe(true)
  })

  it('hides the swap cancel when the subscribe capture starts without a default card', async () => {
    const wrapper = mountDrawer({
      mode: 'subscribe',
      initialClientSecret: 'seti_prepared_secret_456'
    })
    await flush()

    expect(findByName(wrapper, 'PaymentMethodSetupBlock').props('showCancel')).toBe(false)
  })
})
