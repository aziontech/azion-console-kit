import { beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { replaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn()
}))

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

const mountWith = (accountData) => {
  const store = useAccountStore()
  store.setAccountData(accountData)
  return shallowMount(BillingScreen, {
    props: serviceProps()
  })
}

describe('BillingScreen dispatch by account status', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    replaceMock.mockClear()
  })

  it('renders the legacy screen for REGULAR accounts', () => {
    const wrapper = mountWith({ status: 'REGULAR' })
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(true)
    expect(wrapper.findComponent(TabsView).exists()).toBe(false)
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it.each(['TRIAL', 'ONLINE', 'BLOCKED', 'DEFAULTING'])(
    'renders the plans screen for %s accounts',
    (status) => {
      const wrapper = mountWith({ status })
      expect(wrapper.findComponent(TabsView).exists()).toBe(true)
      expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(false)
      expect(replaceMock).not.toHaveBeenCalled()
    }
  )

  it('renders the plans screen when the account has no status', () => {
    const wrapper = mountWith({})
    expect(wrapper.findComponent(TabsView).exists()).toBe(true)
    expect(wrapper.findComponent(LegacyBillingScreen).exists()).toBe(false)
  })
})
