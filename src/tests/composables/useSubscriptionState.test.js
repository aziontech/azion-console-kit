import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { queryClientMock, subscriptionsServiceMock } = vi.hoisted(() => ({
  queryClientMock: {
    fetchQuery: vi.fn((options) => options.queryFn()),
    getQueryData: vi.fn(),
    invalidateQueries: vi.fn()
  },
  subscriptionsServiceMock: { getCurrentSubscription: vi.fn() }
}))

vi.mock('@/services/v2/base/query/queryClient', () => ({ queryClient: queryClientMock }))
vi.mock('@/services/v2/base/query/queryPlugin', () => ({
  waitForPersistenceRestore: vi.fn(() => Promise.resolve())
}))
vi.mock('@/services/v2/billing-api/subscriptions/subscriptions-service', () => ({
  subscriptionsService: subscriptionsServiceMock
}))

import { ensureCurrentSubscription } from '@/composables/useSubscriptionState'
import { useAccountStore } from '@/stores/account'

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { statusCode: status })

describe('ensureCurrentSubscription', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    queryClientMock.fetchQuery.mockImplementation((options) => options.queryFn())
  })

  it('publishes the subscription account_mode into the account store', async () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: 'plan' })
    subscriptionsServiceMock.getCurrentSubscription.mockResolvedValue({
      state: 'executed',
      data: { id: 'sub-uuid', status: 'ACTIVE', accountMode: 'custom', billingMode: 'postpaid' }
    })

    const result = await ensureCurrentSubscription()

    expect(result.data.accountMode).toBe('custom')
    expect(store.accountMode).toBe('custom')
    expect(store.billingExperience).toBe('custom')
  })

  it('keeps the plans experience when the subscription is a plan one', async () => {
    const store = useAccountStore()
    store.setAccountData({ billing_type: null })
    subscriptionsServiceMock.getCurrentSubscription.mockResolvedValue({
      state: 'executed',
      data: { id: 'sub-uuid', status: 'ACTIVE', accountMode: 'plan' }
    })

    await ensureCurrentSubscription()

    expect(store.accountMode).toBe('plan')
    expect(store.billingExperience).toBe('plan')
  })

  it('clears the account_mode when the account has no subscription (404)', async () => {
    const store = useAccountStore()
    store.setSubscriptionAccountMode('custom')
    subscriptionsServiceMock.getCurrentSubscription.mockRejectedValue(httpError(404))

    const result = await ensureCurrentSubscription()

    expect(result).toEqual({ data: null })
    expect(store.accountMode).toBe(null)
  })

  it('reports 501 as unavailable and keeps the previous account_mode', async () => {
    const store = useAccountStore()
    store.setSubscriptionAccountMode('custom')
    subscriptionsServiceMock.getCurrentSubscription.mockRejectedValue(httpError(501))

    const result = await ensureCurrentSubscription()

    expect(result).toEqual({ data: null, unavailable: true })
    expect(store.accountMode).toBe('custom')
  })

  it('reports an ambiguous context (409) as unavailable', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockRejectedValue(httpError(409))

    const result = await ensureCurrentSubscription()

    expect(result).toEqual({ data: null, unavailable: true })
  })

  it('rethrows any other failure', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockRejectedValue(httpError(500))

    await expect(ensureCurrentSubscription()).rejects.toThrow('HTTP 500')
  })
})
