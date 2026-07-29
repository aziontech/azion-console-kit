import { beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { replaceMock, subscriptionRead } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  subscriptionRead: { data: undefined, isError: false }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} })
}))

vi.mock('@/composables/useSubscriptionState', async () => {
  const { computed } = await import('vue')
  return {
    useSubscriptionState: () => ({
      subscriptionQuery: {
        data: computed(() => subscriptionRead.data),
        isError: computed(() => subscriptionRead.isError)
      }
    })
  }
})

import { useAccountStore } from '@/stores/account'
import BillingScreen from '@/views/Billing/index.vue'
import TabsView from '@/views/Billing/TabsView.vue'
import LegacyBillingScreen from '@/views/Billing/legacy/LegacyBillingScreen.vue'
import BillingGateSkeleton from '@/views/Billing/components/BillingGateSkeleton.vue'

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

const settled = (data = { data: null }) => {
  subscriptionRead.data = data
  subscriptionRead.isError = false
}

const pending = () => {
  subscriptionRead.data = undefined
  subscriptionRead.isError = false
}

const mountWith = (accountData) => {
  const store = useAccountStore()
  store.setAccountData(accountData)
  return shallowMount(BillingScreen, {
    props: serviceProps()
  })
}

describe('BillingScreen dispatch by billing_type', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    replaceMock.mockClear()
    settled()
  })

  it('renders the new Service Order/Stripe screen for billing_type=plan', () => {
    const wrapper = mountWith({ billing_type: 'plan' })
    expect(wrapper.findComponent(TabsView).exists()).toBe(true)
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(false)
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('renders the new screen for billing_type=null without redirecting', () => {
    const wrapper = mountWith({ billing_type: null })
    expect(replaceMock).not.toHaveBeenCalled()
    expect(wrapper.findComponent(TabsView).exists()).toBe(true)
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(false)
  })

  it('renders the legacy screen for billing_type=custom', () => {
    const wrapper = mountWith({ billing_type: 'custom' })
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(true)
    expect(wrapper.findComponent(TabsView).exists()).toBe(false)
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('renders the legacy screen for billing_type=internal', () => {
    const wrapper = mountWith({ billing_type: 'internal' })
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(true)
  })

  it('keeps an unknown billing_type on the legacy screen', () => {
    const wrapper = mountWith({ billing_type: 'something-new' })
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(true)
    expect(wrapper.findComponent(TabsView).exists()).toBe(false)
    expect(replaceMock).not.toHaveBeenCalled()
  })
})

describe('BillingScreen dispatch without billing_type', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    replaceMock.mockClear()
    settled()
  })

  it('holds the screen choice while the subscription read is pending', () => {
    pending()
    const wrapper = mountWith({ billing_type: null })
    expect(wrapper.findComponent(BillingGateSkeleton).exists()).toBe(true)
    expect(wrapper.findComponent(TabsView).exists()).toBe(false)
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(false)
  })

  it('does not hold when a managed billing_type already decides the screen', () => {
    pending()
    const wrapper = mountWith({ billing_type: 'custom' })
    expect(wrapper.findComponent(BillingGateSkeleton).exists()).toBe(false)
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(true)
  })

  it('does not hold when the local override already decides the screen', () => {
    pending()
    const wrapper = mountWith({ billing_type: null, billing_type_overridden: true })
    expect(wrapper.findComponent(BillingGateSkeleton).exists()).toBe(false)
    expect(wrapper.findComponent(TabsView).exists()).toBe(true)
  })

  it('renders the legacy screen once the subscription reports account_mode=custom', () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: null })
    store.setSubscriptionAccountMode('custom')
    const wrapper = shallowMount(BillingScreen, { props: serviceProps() })
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(true)
    expect(wrapper.findComponent(TabsView).exists()).toBe(false)
  })

  it('renders the plans screen when the account has no subscription at all', () => {
    settled({ data: null })
    const wrapper = mountWith({ billing_type: null })
    expect(wrapper.findComponent(TabsView).exists()).toBe(true)
  })

  it('falls back to the plans screen when the subscription read fails', () => {
    subscriptionRead.data = undefined
    subscriptionRead.isError = true
    const wrapper = mountWith({ billing_type: null })
    expect(wrapper.findComponent(TabsView).exists()).toBe(true)
  })

  it('renders the plans screen when the read is unavailable (501/409)', () => {
    settled({ data: null, unavailable: true })
    const wrapper = mountWith({ billing_type: null })
    expect(wrapper.findComponent(TabsView).exists()).toBe(true)
  })
})
