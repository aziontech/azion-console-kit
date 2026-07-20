import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PricingCalculationBlock from '@/templates/checkout-block/pricing-calculation-block.vue'

const mocks = vi.hoisted(() => ({
  prepareCheckoutSession: vi.fn(),
  initializePlans: vi.fn(),
  setPlanParam: vi.fn(),
  sharedBillingCycle: { value: 'monthly' },
  plans: {
    value: [
      {
        sku: 'pro',
        pricings: [
          { id: 'price_monthly', periodicity: 'monthly', priceValue: 10 },
          { id: 'price_yearly', periodicity: 'yearly', priceValue: 100 }
        ]
      }
    ]
  }
}))

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: vi.fn() })
}))

vi.mock('@/composables/usePlans', () => ({
  usePlans: () => ({
    initialize: mocks.initializePlans,
    billingCycle: mocks.sharedBillingCycle,
    setParam: mocks.setPlanParam
  })
}))

vi.mock('@/composables/useCheckoutSessionPreparer', () => ({
  useCheckoutSessionPreparer: () => ({
    prepare: mocks.prepareCheckoutSession,
    isPreparing: { value: false }
  })
}))

vi.mock('@/services/v2/service-orders/service-orders-service', () => ({
  serviceOrdersService: {
    useListPlansQuery: () => ({ data: mocks.plans })
  }
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

const mountPricingCalculationBlock = (props = {}) =>
  mount(PricingCalculationBlock, {
    props: {
      plan: 'pro',
      ...props
    },
    global: {
      stubs: {
        PlanCardHeader: {
          template: '<section><slot name="action" /></section>'
        },
        BillingCycleToggle: {
          name: 'BillingCycleToggle',
          props: ['modelValue', 'disabled'],
          emits: ['update:modelValue'],
          template: '<button />'
        },
        PricingSummary: {
          template: '<div />'
        }
      }
    }
  })

describe('pricing-calculation-block', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.prepareCheckoutSession.mockReset()
    mocks.initializePlans.mockReset()
    mocks.setPlanParam.mockReset()
    mocks.sharedBillingCycle.value = 'monthly'
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits the initial billing cycle without preparing a new checkout session', () => {
    mocks.sharedBillingCycle.value = 'yearly'

    const wrapper = mountPricingCalculationBlock()

    expect(wrapper.emitted('update:billingCycle')?.at(-1)).toEqual(['yearly'])
    expect(mocks.prepareCheckoutSession).not.toHaveBeenCalled()
  })

  it('clears the current checkout session as soon as billing cycle changes', async () => {
    const wrapper = mountPricingCalculationBlock()
    const toggle = wrapper.findComponent({ name: 'BillingCycleToggle' })

    await toggle.vm.$emit('update:modelValue', 'yearly')

    expect(wrapper.emitted('update:checkoutSessionClientSecret')?.at(-1)).toEqual([''])
    expect(mocks.prepareCheckoutSession).not.toHaveBeenCalled()
  })

  it('keeps the latest billing-cycle checkout session when older preparation resolves later', async () => {
    const yearlyPreparation = createDeferred()
    const monthlyPreparation = createDeferred()
    mocks.prepareCheckoutSession.mockImplementation(({ preferredCycle }) => {
      if (preferredCycle === 'yearly') return yearlyPreparation.promise
      if (preferredCycle === 'monthly') return monthlyPreparation.promise
      return Promise.resolve('')
    })

    const wrapper = mountPricingCalculationBlock()
    const toggle = wrapper.findComponent({ name: 'BillingCycleToggle' })

    await toggle.vm.$emit('update:modelValue', 'yearly')
    await vi.advanceTimersByTimeAsync(250)
    expect(mocks.prepareCheckoutSession).toHaveBeenCalledWith({
      plan: 'pro',
      preferredCycle: 'yearly',
      draftServiceOrderId: null,
      signup: false
    })

    await toggle.vm.$emit('update:modelValue', 'monthly')
    await vi.advanceTimersByTimeAsync(250)
    expect(mocks.prepareCheckoutSession).toHaveBeenLastCalledWith({
      plan: 'pro',
      preferredCycle: 'monthly',
      draftServiceOrderId: null,
      signup: false
    })

    monthlyPreparation.resolve('cs_monthly')
    await flushPromises()
    yearlyPreparation.resolve('cs_yearly')
    await flushPromises()

    expect(wrapper.emitted('update:checkoutSessionClientSecret')?.at(-1)).toEqual(['cs_monthly'])
  })

  it('marks checkout preparation as signup when used in signup context', async () => {
    mocks.prepareCheckoutSession.mockResolvedValue('cs_yearly')

    const wrapper = mountPricingCalculationBlock({ context: 'signup' })
    const toggle = wrapper.findComponent({ name: 'BillingCycleToggle' })

    await toggle.vm.$emit('update:modelValue', 'yearly')
    await vi.advanceTimersByTimeAsync(250)

    expect(mocks.prepareCheckoutSession).toHaveBeenCalledWith({
      plan: 'pro',
      preferredCycle: 'yearly',
      draftServiceOrderId: null,
      signup: true
    })
  })
})
