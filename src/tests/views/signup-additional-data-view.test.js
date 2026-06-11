import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdditionalDataView from '@/views/Signup/AdditionalDataView.vue'

const mocks = vi.hoisted(() => ({
  preparePaidSignupCheckout: vi.fn(),
  submitSignupPlanFromDraftOrCreate: vi.fn(),
  prepareSignupCheckout: vi.fn(),
  ensurePlansList: vi.fn(),
  warmStripe: vi.fn(),
  clearAdditionalDataFormState: vi.fn(),
  clearPlans: vi.fn(),
  initializePlans: vi.fn(),
  removeQueries: vi.fn(),
  captureException: vi.fn(),
  plansData: {
    value: [
      {
        id: 2,
        sku: 'pro',
        pricings: [{ id: 20, periodicity: 'monthly', priceValue: 10 }]
      }
    ]
  },
  storedPlan: { value: 'hobby' },
  storedBillingCycle: { value: 'monthly' },
  accountStore: {
    accountData: { id: 123, email: 'user@example.com' }
  }
}))

vi.mock('@/composables/signup-checkout-preparation', () => ({
  preparePaidSignupCheckout: mocks.preparePaidSignupCheckout,
  submitSignupPlanFromDraftOrCreate: mocks.submitSignupPlanFromDraftOrCreate
}))

vi.mock('@/composables/usePlansService', () => ({
  usePlansList: () => ({ data: mocks.plansData }),
  ensurePlansList: mocks.ensurePlansList
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: () => mocks.accountStore
}))

vi.mock('@/composables/useServiceOrders', () => ({
  useServiceOrders: () => ({
    prepareSignupCheckout: mocks.prepareSignupCheckout,
    isLoading: { value: false }
  })
}))

vi.mock('@/composables/useAdditionalDataFormState', () => ({
  useAdditionalDataFormState: () => ({
    clear: mocks.clearAdditionalDataFormState
  })
}))

vi.mock('@/composables/usePlans', () => ({
  usePlans: () => ({
    initialize: mocks.initializePlans,
    plan: mocks.storedPlan,
    billingCycle: mocks.storedBillingCycle,
    clear: mocks.clearPlans
  })
}))

vi.mock('@/composables/useWarmStripe', () => ({
  useWarmStripe: () => ({ warmStripe: mocks.warmStripe })
}))

vi.mock('@/helpers/account-data', () => ({
  loadUserAndAccountInfo: vi.fn()
}))

vi.mock('@/helpers/persist-onboarding-data', () => ({
  persistOnboardingData: vi.fn()
}))

vi.mock('@/composables/post-payment-flag', () => ({
  markAwaitingActiveServiceOrder: vi.fn()
}))

vi.mock('@/services/v2/base/query/queryClient', () => ({
  queryClient: {
    removeQueries: mocks.removeQueries
  }
}))

vi.mock('@/services/v2/base/query/queryKeys', () => ({
  queryKeys: {
    serviceOrders: { all: ['service-orders'] },
    billing: { all: ['billing'] },
    plans: { all: ['plans'] }
  }
}))

vi.mock('@sentry/vue', () => ({
  captureException: mocks.captureException
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

const flushPromises = () => Promise.resolve().then(() => Promise.resolve())

const createDeferred = () => {
  let resolve
  let reject
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

const AdditionalDataFormStub = defineComponent({
  emits: ['plan-change', 'validity-change'],
  data: () => ({
    plan: 'hobby',
    meta: { valid: true },
    loading: false
  }),
  mounted() {
    this.$emit('validity-change', this.meta.valid)
  },
  methods: {
    selectPlan(plan, billingCycle) {
      this.plan = plan
      mocks.storedPlan.value = plan
      mocks.storedBillingCycle.value = billingCycle
      this.$emit('plan-change', { plan, billingCycle })
    },
    submitForm() {
      return Promise.resolve()
    }
  },
  template: `
    <div>
      <button
        data-testid="select-pro"
        @click="selectPlan('pro', 'yearly')"
      />
      <button
        data-testid="select-pro-monthly"
        @click="selectPlan('pro', 'monthly')"
      />
      <button
        data-testid="select-hobby"
        @click="selectPlan('hobby', 'monthly')"
      />
    </div>
  `
})

const mountAdditionalDataView = () =>
  mount(AdditionalDataView, {
    global: {
      provide: {
        tracker: {
          signUp: {}
        }
      },
      stubs: {
        CardBox: {
          template: '<section><slot name="content" /><slot name="footer" /></section>'
        },
        AdditionalDataFormBlock: AdditionalDataFormStub,
        ChoosingPlanContainer: {
          template: `
            <div>
              <button
                data-testid="checkout-session-prepared"
                @click="$emit('checkout-session-prepared', {
                  clientSecret: 'cs_yearly',
                  billingCycle: 'yearly'
                })"
              />
              <button
                data-testid="payment-element-ready"
                @click="$emit('payment-element-ready')"
              />
            </div>
          `,
          emits: ['checkout-session-prepared', 'payment-element-ready']
        },
        PlanSuccessBlock: {
          template: '<div />'
        },
        ActionButton: {
          template: '<button data-testid="continue" @click="$emit(\'click\')" />',
          emits: ['click']
        }
      }
    }
  })

describe('Signup AdditionalDataView checkout preparation', () => {
  beforeEach(() => {
    mocks.preparePaidSignupCheckout.mockReset()
    mocks.submitSignupPlanFromDraftOrCreate.mockReset()
    mocks.prepareSignupCheckout.mockReset()
    mocks.ensurePlansList.mockReset()
    mocks.warmStripe.mockReset()
    mocks.clearAdditionalDataFormState.mockReset()
    mocks.clearPlans.mockReset()
    mocks.initializePlans.mockReset()
    mocks.removeQueries.mockReset()
    mocks.captureException.mockReset()
    mocks.plansData.value = [
      {
        id: 2,
        sku: 'pro',
        pricings: [{ id: 20, periodicity: 'monthly', priceValue: 10 }]
      }
    ]
    mocks.storedPlan.value = 'hobby'
    mocks.storedBillingCycle.value = 'monthly'
    mocks.accountStore.accountData = { id: 123, email: 'user@example.com' }
    mocks.preparePaidSignupCheckout.mockResolvedValue({
      clientSecret: 'cs_test',
      draftServiceOrderId: 321
    })
    mocks.ensurePlansList.mockResolvedValue(mocks.plansData.value)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts Pro checkout preparation immediately when the plan selection changes', async () => {
    const wrapper = mountAdditionalDataView()

    await wrapper.get('[data-testid="select-pro"]').trigger('click')
    await flushPromises()

    expect(mocks.preparePaidSignupCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 123,
        plan: 'pro',
        billingCycle: 'yearly',
        plans: mocks.plansData.value,
        prepareSignupCheckout: mocks.prepareSignupCheckout
      })
    )
    expect(vi.getTimerCount()).toBe(0)
  })

  it('submits Hobby without waiting for an obsolete Pro checkout preparation', async () => {
    const preparation = createDeferred()
    mocks.preparePaidSignupCheckout.mockReturnValueOnce(preparation.promise)
    mocks.submitSignupPlanFromDraftOrCreate.mockResolvedValue({
      draftServiceOrderId: 'so_hobby',
      serviceOrder: { serviceOrderId: 'so_hobby' }
    })
    const wrapper = mountAdditionalDataView()

    await wrapper.get('[data-testid="select-pro"]').trigger('click')
    await wrapper.get('[data-testid="select-hobby"]').trigger('click')

    await wrapper.get('[data-testid="actions-button"]').trigger('click')
    await flushPromises()

    expect(mocks.submitSignupPlanFromDraftOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'hobby',
        prepareSignupCheckout: mocks.prepareSignupCheckout
      })
    )

    preparation.resolve({
      clientSecret: 'cs_stale',
      draftServiceOrderId: 'so_stale',
      serviceOrder: { serviceOrderId: 'so_stale', status: 'DRAFT' }
    })
    await flushPromises()
  })

  it('reuses checkout sessions prepared by the billing-cycle toggle when returning to checkout', async () => {
    const wrapper = mountAdditionalDataView()

    await wrapper.get('[data-testid="select-pro-monthly"]').trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(mocks.preparePaidSignupCheckout).toHaveBeenCalledTimes(1)

    mocks.storedBillingCycle.value = 'yearly'
    await wrapper.get('[data-testid="checkout-session-prepared"]').trigger('click')
    await wrapper.get('[data-testid="payment-element-ready"]').trigger('click')

    await wrapper.get('[data-testid="actions-button"]').trigger('click')
    await flushPromises()

    expect(mocks.preparePaidSignupCheckout).toHaveBeenCalledTimes(1)
  })
})
