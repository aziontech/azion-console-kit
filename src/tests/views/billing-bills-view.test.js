import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BillsView from '@/views/Billing/BillsView.vue'

const mocks = vi.hoisted(() => ({
  setPlanParam: vi.fn(),
  syncToUrl: vi.fn(),
  createServiceOrder: vi.fn(),
  upgradeServiceOrder: vi.fn(),
  downgradeServiceOrder: vi.fn(),
  cancelDowngrade: vi.fn(),
  loadAccountServiceOrders: vi.fn(),
  warmStripe: vi.fn(),
  refetchSubscription: vi.fn(),
  checkoutPrepared: vi.fn(),
  plans: {
    value: [
      {
        id: 'plan_pro',
        sku: 'pro',
        pricings: [{ id: 'price_monthly', periodicity: 'monthly' }]
      }
    ]
  },
  activeServiceOrder: { value: null },
  serviceOrder: { value: null }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia')

  return {
    ...actual,
    storeToRefs: () => ({
      showExportBilling: { value: false },
      accountIsNotRegular: { value: false }
    })
  }
})

vi.mock('@sentry/vue', () => ({
  captureException: vi.fn()
}))

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: vi.fn() })
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    accountData: { id: 123 },
    showExportBilling: false,
    accountIsNotRegular: false
  })
}))

vi.mock('@/composables/usePlans', () => ({
  usePlans: () => ({
    initialize: vi.fn(),
    billingCycle: { value: 'monthly' },
    setParam: mocks.setPlanParam,
    syncToUrl: mocks.syncToUrl
  })
}))

vi.mock('@/composables/usePlansService', () => ({
  usePlansList: () => ({ data: mocks.plans })
}))

vi.mock('@/composables/useCurrentSubscription', () => ({
  useCurrentSubscription: () => ({
    planTitle: { value: 'Hobby' },
    planTag: { value: 'Hobby' },
    planStartDate: { value: '' },
    billingPeriod: { value: 'Monthly' },
    nextChargeDate: { value: '' },
    nextChargeValue: { value: '$0.00' },
    planChargeValue: { value: '$0.00' },
    currentInvoiceAmountCharged: { value: null },
    isHobby: { value: true },
    isPro: { value: false },
    isLoading: { value: false },
    isDowngradePending: { value: false },
    scheduledDowngrade: { value: null },
    planSku: { value: 'hobby' },
    billingCycle: { value: 'monthly' },
    refetch: mocks.refetchSubscription,
    refetchUntil: vi.fn()
  })
}))

vi.mock('@/composables/useBillingPaymentMethods', () => ({
  useBillingPaymentMethods: () => ({ defaultPaymentMethod: { value: null } })
}))

vi.mock('@/composables/useServiceOrders', () => ({
  useServiceOrders: () => ({
    downgrade: mocks.downgradeServiceOrder,
    upgrade: mocks.upgradeServiceOrder,
    createServiceOrder: mocks.createServiceOrder,
    cancelDowngrade: mocks.cancelDowngrade,
    loadAccountServiceOrders: mocks.loadAccountServiceOrders,
    serviceOrder: mocks.serviceOrder,
    activeServiceOrder: mocks.activeServiceOrder
  })
}))

vi.mock('@/composables/useWarmStripe', () => ({
  useWarmStripe: () => ({ warmStripe: mocks.warmStripe })
}))

vi.mock('@/composables/post-payment-flag', () => ({
  markAwaitingActiveServiceOrder: vi.fn()
}))

const flushPromises = () => Promise.resolve().then(() => Promise.resolve())

const mountBillsView = () =>
  mount(BillsView, {
    props: {
      listPaymentHistoryService: vi.fn(),
      documentPaymentHistoryService: vi.fn(),
      loadYourServicePlanService: vi.fn(),
      openPlans: vi.fn(),
      loadContractServicePlan: vi.fn(),
      loadCurrentInvoiceService: vi.fn().mockResolvedValue({}),
      getStripeClientService: vi.fn()
    },
    global: {
      provide: {
        tracker: { billing: {} }
      },
      stubs: {
        DowngradePendingBanner: { template: '<div />' },
        SubscriptionPlanCard: { template: '<section />' },
        UpgradeToProCard: {
          emits: ['upgrade'],
          template: '<button data-testid="upgrade" @click="$emit(\'upgrade\')" />'
        },
        CurrentInvoiceCard: { template: '<section />' },
        BillingCardSkeleton: { template: '<section />' },
        ListTable: { template: '<section />' },
        EmptyResultsBlock: { template: '<section />' },
        PlanSelectionDrawer: { template: '<section />' },
        DrawerPlanInfo: {
          props: ['plan'],
          emits: ['prepareCheckoutSession'],
          methods: {
            prepare() {
              this.$emit('prepareCheckoutSession', {
                plan: this.plan,
                billingCycle: 'monthly',
                done: mocks.checkoutPrepared,
                fail: vi.fn()
              })
            }
          },
          template: `
            <section>
              <button data-testid="prepare" @click="prepare" />
            </section>
          `
        },
        DialogDowngradePlan: { template: '<section />' },
        DialogCancelDowngrade: { template: '<section />' }
      }
    }
  })

describe('BillsView', () => {
  beforeEach(() => {
    mocks.setPlanParam.mockReset()
    mocks.syncToUrl.mockReset()
    mocks.syncToUrl.mockResolvedValue()
    mocks.createServiceOrder.mockReset()
    mocks.createServiceOrder.mockResolvedValue({ payment: { clientSecret: 'cs_created' } })
    mocks.upgradeServiceOrder.mockReset()
    mocks.downgradeServiceOrder.mockReset()
    mocks.cancelDowngrade.mockReset()
    mocks.loadAccountServiceOrders.mockReset()
    mocks.loadAccountServiceOrders.mockResolvedValue({ active: null, draft: null })
    mocks.warmStripe.mockReset()
    mocks.refetchSubscription.mockReset()
    mocks.refetchSubscription.mockResolvedValue()
    mocks.checkoutPrepared.mockReset()
    mocks.activeServiceOrder.value = null
    mocks.serviceOrder.value = null
  })

  it('creates a paid service order on explicit checkout preparation when Hobby has no active service order', async () => {
    const wrapper = mountBillsView()

    await wrapper.get('[data-testid="upgrade"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="prepare"]').trigger('click')
    await flushPromises()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(mocks.createServiceOrder).toHaveBeenCalledWith({
      planId: 'plan_pro',
      planPricingId: 'price_monthly'
    })
    expect(mocks.upgradeServiceOrder).not.toHaveBeenCalled()
    expect(mocks.checkoutPrepared).toHaveBeenCalledWith('cs_created')
  })
})
