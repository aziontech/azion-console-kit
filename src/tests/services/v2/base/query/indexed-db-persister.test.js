import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const store = {}
vi.mock('idb-keyval', () => ({
  createStore: vi.fn(() => store),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn()
}))

import { createIDBPersister } from '@/services/v2/base/query/indexedDbPersister'
import { set, del } from 'idb-keyval'

const CONFIG = { idbName: 'azion', storeName: 'cache-store', cacheKey: 'query-cache' }
const THROTTLE_MS = 2000

describe('createIDBPersister throttled persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes the pending client after the throttle window elapses', async () => {
    const persister = createIDBPersister(CONFIG)

    persister.persistClient({ timestamp: 1 })
    await vi.advanceTimersByTimeAsync(THROTTLE_MS)

    expect(set).toHaveBeenCalledWith(CONFIG.cacheKey, { timestamp: 1 }, store)
  })

  it('cancelPendingPersist prevents a scheduled write from firing after cleanup', async () => {
    const persister = createIDBPersister(CONFIG)

    persister.persistClient({ timestamp: 1 })
    persister.cancelPendingPersist()
    await vi.advanceTimersByTimeAsync(THROTTLE_MS * 2)

    expect(set).not.toHaveBeenCalled()
  })

  it('removeClient deletes the persisted cache key', async () => {
    const persister = createIDBPersister(CONFIG)

    await persister.removeClient()

    expect(del).toHaveBeenCalledWith(CONFIG.cacheKey, store)
  })
})
