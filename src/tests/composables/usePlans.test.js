import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  route: { path: '/signup', query: {} },
  router: { replace: vi.fn() },
  accountStore: { account: { client_id: 'client-1' } },
  readScoped: vi.fn(),
  writeScoped: vi.fn(),
  removeScoped: vi.fn(),
  migrateGuestTo: vi.fn(),
  onSwitchAccount: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: () => mocks.accountStore
}))

vi.mock('@/helpers/client-scoped-storage', () => ({
  readScoped: mocks.readScoped,
  writeScoped: mocks.writeScoped,
  removeScoped: mocks.removeScoped,
  migrateGuestTo: mocks.migrateGuestTo
}))

vi.mock('@/services/v2/base/auth/session-broadcast', () => ({
  onSwitchAccount: mocks.onSwitchAccount
}))

const mountUsePlans = async (defaults = {}) => {
  vi.resetModules()
  const { usePlans } = await import('@/composables/usePlans')

  return mount(
    defineComponent({
      setup() {
        const plans = usePlans()
        plans.initialize(defaults)
        return { plan: plans.plan, billingCycle: plans.billingCycle }
      },
      template: '<span>{{ plan }}:{{ billingCycle }}</span>'
    })
  )
}

describe('usePlans', () => {
  beforeEach(() => {
    mocks.route.query = {}
    mocks.router.replace.mockReset()
    mocks.readScoped.mockReset()
    mocks.writeScoped.mockReset()
    mocks.removeScoped.mockReset()
    mocks.migrateGuestTo.mockReset()
    mocks.onSwitchAccount.mockReset()
    mocks.readScoped.mockReturnValue(null)
  })

  it('defaults signup plan selection to Hobby monthly', async () => {
    const wrapper = await mountUsePlans({ defaultPlan: 'hobby', defaultBillingCycle: 'monthly' })

    expect(wrapper.text()).toBe('hobby:monthly')
  })

  it('does not apply signup defaults outside signup callers', async () => {
    const wrapper = await mountUsePlans()

    expect(wrapper.text()).toBe(':')
  })

  it('keeps explicit Pro URL selection', async () => {
    mocks.route.query = { plan: 'pro', 'billing-cycle': 'yearly' }

    const wrapper = await mountUsePlans()

    expect(wrapper.text()).toBe('pro:yearly')
  })

  it('fills missing signup cycle when URL only provides plan', async () => {
    mocks.route.query = { plan: 'pro' }

    const wrapper = await mountUsePlans({ defaultPlan: 'hobby', defaultBillingCycle: 'monthly' })

    expect(wrapper.text()).toBe('pro:monthly')
  })

  it('fills missing signup plan when URL only provides billing cycle', async () => {
    mocks.route.query = { 'billing-cycle': 'yearly' }

    const wrapper = await mountUsePlans({ defaultPlan: 'hobby', defaultBillingCycle: 'monthly' })

    expect(wrapper.text()).toBe('hobby:yearly')
  })

  it('lets explicit URL selection override stored signup plan', async () => {
    mocks.route.query = { plan: 'pro', 'billing-cycle': 'yearly' }
    mocks.readScoped.mockReturnValue({ plan: 'hobby', billingCycle: 'monthly' })

    const wrapper = await mountUsePlans()

    expect(wrapper.text()).toBe('pro:yearly')
  })
})
