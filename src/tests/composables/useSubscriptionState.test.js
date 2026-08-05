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

import {
  UNAVAILABLE_REASON,
  ensureCurrentSubscription,
  waitForActiveSubscription
} from '@/composables/useSubscriptionState'

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { statusCode: status })

describe('ensureCurrentSubscription', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    queryClientMock.fetchQuery.mockImplementation((options) => options.queryFn())
  })

  it('returns the current subscription payload', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockResolvedValue({
      state: 'executed',
      data: { id: 'sub-uuid', status: 'ACTIVE', planId: 'plan-uuid' }
    })

    const result = await ensureCurrentSubscription()

    expect(result.data.id).toBe('sub-uuid')
    expect(result.data.planId).toBe('plan-uuid')
  })

  it('reads through the shared query cache with a positive staleTime', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockResolvedValue({ data: null })

    await ensureCurrentSubscription()

    const options = queryClientMock.fetchQuery.mock.calls[0][0]
    expect(options.queryKey).toEqual(['subscriptions', 'current'])
    expect(options.staleTime).toBeGreaterThan(0)
    expect(options.meta).toEqual({ persist: false })
  })

  it('bypasses the cache when a fresh read is requested', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockResolvedValue({ data: null })

    await ensureCurrentSubscription({ fresh: true })

    const options = queryClientMock.fetchQuery.mock.calls[0][0]
    expect(options.staleTime).toBe(0)
  })

  it('maps a 404 to an empty subscription read', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockRejectedValue(httpError(404))

    const result = await ensureCurrentSubscription()

    expect(result).toEqual({ data: null })
  })

  it('reports 501 as unavailable/not_implemented', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockRejectedValue(httpError(501))

    const result = await ensureCurrentSubscription()

    expect(result).toEqual({
      data: null,
      unavailable: true,
      reason: UNAVAILABLE_REASON.NOT_IMPLEMENTED
    })
  })

  it('separates an ambiguous context (409, ADR-13) from a stubbed endpoint', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockRejectedValue(httpError(409))

    const result = await ensureCurrentSubscription()

    expect(result).toEqual({
      data: null,
      unavailable: true,
      reason: UNAVAILABLE_REASON.AMBIGUOUS_CONTEXT
    })
    expect(result.reason).not.toBe(UNAVAILABLE_REASON.NOT_IMPLEMENTED)
  })

  it('rethrows any other failure', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockRejectedValue(httpError(500))

    await expect(ensureCurrentSubscription()).rejects.toThrow('HTTP 500')
  })
})

describe('waitForActiveSubscription', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    queryClientMock.fetchQuery.mockImplementation((options) => options.queryFn())
  })

  it('polls until the subscription is entitled and returns it', async () => {
    subscriptionsServiceMock.getCurrentSubscription
      .mockResolvedValueOnce({ state: 'executed', data: { id: 'sub', status: 'DRAFT' } })
      .mockResolvedValueOnce({ state: 'executed', data: { id: 'sub', status: 'ACTIVE' } })

    const result = await waitForActiveSubscription({ attempts: 3, delayMs: 0 })

    expect(subscriptionsServiceMock.getCurrentSubscription).toHaveBeenCalledTimes(2)
    expect(result.status).toBe('ACTIVE')
  })

  it('polls with fresh reads so the cache never satisfies an attempt', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockResolvedValue({
      state: 'executed',
      data: { id: 'sub', status: 'ACTIVE' }
    })

    await waitForActiveSubscription({ attempts: 1, delayMs: 0 })

    const options = queryClientMock.fetchQuery.mock.calls[0][0]
    expect(options.staleTime).toBe(0)
  })

  it('accepts the lowercase spec status too', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockResolvedValue({
      state: 'executed',
      data: { id: 'sub', status: 'active' }
    })

    const result = await waitForActiveSubscription({ attempts: 2, delayMs: 0 })

    expect(result).not.toBeNull()
    expect(result.id).toBe('sub')
    expect(subscriptionsServiceMock.getCurrentSubscription).toHaveBeenCalledTimes(1)
  })

  it('stops immediately when the read is unavailable (501/409) instead of burning the budget', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockRejectedValue(httpError(501))

    const result = await waitForActiveSubscription({ attempts: 4, delayMs: 0 })

    expect(subscriptionsServiceMock.getCurrentSubscription).toHaveBeenCalledTimes(1)
    expect(result).toBeNull()
  })

  it('gives up after the attempt budget and returns null', async () => {
    subscriptionsServiceMock.getCurrentSubscription.mockResolvedValue({
      state: 'executed',
      data: { id: 'sub', status: 'DRAFT' }
    })

    const result = await waitForActiveSubscription({ attempts: 2, delayMs: 0 })

    expect(subscriptionsServiceMock.getCurrentSubscription).toHaveBeenCalledTimes(2)
    expect(result).toBeNull()
  })
})
