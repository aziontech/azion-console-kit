import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@/services/v2/base/query/cacheStore', () => {
  return {
    cacheStore: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clearAllByPrefix: vi.fn()
    }
  }
})

import { QueryClient } from '@/services/v2/base/query/queryClient'
import { cacheStore } from '@/services/v2/base/query/cacheStore'
import { queryDevtools } from '@/services/v2/base/query/queryDevtools'

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const waitForExpectation = async (assertion, attempts = 10) => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      assertion()
      return
    } catch (error) {
      if (i === attempts - 1) throw error
      await Promise.resolve()
    }
  }
}

describe('QueryClient devtools integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    queryDevtools.reset()
    cacheStore.get.mockReset()
    cacheStore.set.mockReset()
    cacheStore.remove.mockReset()
    cacheStore.clearAllByPrefix.mockReset()
    cacheStore.get.mockResolvedValue(null)
    cacheStore.set.mockResolvedValue()
    cacheStore.remove.mockResolvedValue()
    cacheStore.clearAllByPrefix.mockResolvedValue()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('tracks auto refresh requests and statuses', async () => {
    const queryFn = vi.fn().mockResolvedValue('fresh data')
    const client = new QueryClient()

    const state = client.query({
      queryKey: 'GLOBAL:test',
      queryFn,
      refetchInterval: 5000
    })

    await flushPromises()
    await waitForExpectation(() => {
      expect(queryDevtools.getQuery('GLOBAL:test')?.status).toBe('success')
    })

    let tracked = queryDevtools.getQuery('GLOBAL:test')
    expect(tracked).toBeTruthy()
    expect(tracked.status).toBe('success')
    expect(tracked.refetchInterval).toBe(5000)
    expect(tracked.isAutoRefreshing).toBe(true)
    expect(tracked.isFetching).toBe(false)
    expect(tracked.fetchCount).toBe(1)
    expect(tracked.lastUpdatedAt).toBe(new Date('2024-01-01T00:00:00Z').getTime())
    expect(tracked.nextAutoRefreshAt).toBe(tracked.lastUpdatedAt + 5000)

    await vi.advanceTimersByTimeAsync(5000)
    await flushPromises()
    await waitForExpectation(() => {
      expect(queryDevtools.getQuery('GLOBAL:test')?.fetchCount).toBe(2)
    })

    tracked = queryDevtools.getQuery('GLOBAL:test')
    expect(tracked.fetchCount).toBe(2)
    expect(tracked.lastUpdatedAt).toBe(new Date('2024-01-01T00:00:05Z').getTime())
    expect(tracked.nextAutoRefreshAt).toBe(tracked.lastUpdatedAt + 5000)

    await client.invalidate('GLOBAL:test')
    tracked = queryDevtools.getQuery('GLOBAL:test')
    expect(tracked.status).toBe('idle')
    expect(tracked.isAutoRefreshing).toBe(false)
    expect(tracked.refetchInterval).toBeNull()
    expect(tracked.nextAutoRefreshAt).toBeNull()

    await client.unregister('GLOBAL:test', state)
    expect(queryDevtools.getQuery('GLOBAL:test')).toBeUndefined()
  })

  it('continues auto refresh scheduling when document is unavailable', async () => {
    const queryFn = vi.fn().mockResolvedValue('fresh data')
    const client = new QueryClient()
    const originalDocument = globalThis.document

    globalThis.document = undefined

    try {
      client.query({
        queryKey: 'GLOBAL:no-doc',
        queryFn,
        refetchInterval: 2000
      })

      await flushPromises()
      await waitForExpectation(() => {
        expect(queryDevtools.getQuery('GLOBAL:no-doc')?.status).toBe('success')
      })

      await vi.advanceTimersByTimeAsync(2000)
      await flushPromises()

      await waitForExpectation(() => {
        expect(queryDevtools.getQuery('GLOBAL:no-doc')?.fetchCount).toBe(2)
      })
    } finally {
      globalThis.document = originalDocument
    }
  })
})
