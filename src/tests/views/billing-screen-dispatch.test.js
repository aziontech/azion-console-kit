import { beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} })
}))

import { useAccountStore } from '@/stores/account'
import BillingScreen from '@/views/Billing/index.vue'
import TabsView from '@/views/Billing/TabsView.vue'
import LegacyBillingScreen from '@/views/Billing/legacy/LegacyBillingScreen.vue'

const noop = () => {}

const serviceProps = () => ({
  loadPaymentMethodDefaultService: noop,
  getStripeClientService: noop,
  loadCurrentInvoiceService: noop,
  loadInvoiceDataService: noop,
  listServiceAndProductsChangesService: noop,
  documentPaymentMethodService: noop,
  listPaymentHistoryService: noop,
  documentPaymentHistoryService: noop,
  loadYourServicePlanService: noop,
  openPlans: noop,
  loadContractServicePlan: noop,
  loadInvoiceLastUpdatedService: noop,
  cardDefault: { loader: false }
})

const mountWith = (billingType) => {
  const store = useAccountStore()
  store.setAccountData({ billing_type: billingType })
  return shallowMount(BillingScreen, {
    props: serviceProps()
  })
}

describe('BillingScreen dispatch by billing_type', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    replaceMock.mockClear()
  })

  it('renders the new Service Order/Stripe screen for billing_type=plan', () => {
    const wrapper = mountWith('plan')
    expect(wrapper.findComponent(TabsView).exists()).toBe(true)
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(false)
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('redirects to onboarding and renders no billing screen for billing_type=null', () => {
    const wrapper = mountWith(null)
    expect(replaceMock).toHaveBeenCalledWith({ name: 'additional-data' })
    expect(wrapper.findComponent(TabsView).exists()).toBe(false)
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(false)
  })

  it('renders the legacy screen for billing_type=custom', () => {
    const wrapper = mountWith('custom')
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(true)
    expect(wrapper.findComponent(TabsView).exists()).toBe(false)
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('renders the legacy screen for billing_type=internal', () => {
    const wrapper = mountWith('internal')
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(true)
  })

  it('falls back to the new screen for an unknown billing_type', () => {
    const wrapper = mountWith('something-new')
    expect(wrapper.findComponent(TabsView).exists()).toBe(true)
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
