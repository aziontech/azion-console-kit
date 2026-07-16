import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  resetAccount: vi.fn(),
  cancelPendingPersist: vi.fn(),
  removeClient: vi.fn(),
  pauseQueryPersistence: vi.fn(),
  clearAllCache: vi.fn(),
  resetCacheSync: vi.fn(),
  startCacheSync: vi.fn(),
  sendSwitchAccountBroadcast: vi.fn()
}))

vi.mock('@/services/v2/base/query/queryPlugin', () => ({
  persister: {
    removeClient: mocks.removeClient,
    cancelPendingPersist: mocks.cancelPendingPersist
  },
  pauseQueryPersistence: mocks.pauseQueryPersistence,
  resumeQueryPersistence: vi.fn(),
  waitForPersistenceRestore: vi.fn().mockResolvedValue(undefined),
  clearAllCacheAndDeleteAzionIndexedDB: vi.fn(),
  queryPlugin: {}
}))
vi.mock('@/services/v2/base/query/queryClient', () => ({
  queryClient: {},
  clearAllCache: mocks.clearAllCache
}))
vi.mock('@/services/v2/base/cache-sync/cache-sync-service', () => ({
  startCacheSync: mocks.startCacheSync,
  resetCacheSync: mocks.resetCacheSync
}))
vi.mock('@/services/v2/base/auth/session-broadcast', () => ({
  sendSwitchAccountBroadcast: mocks.sendSwitchAccountBroadcast
}))
vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({ resetAccount: mocks.resetAccount, isClientAccount: false })
}))

import { sessionManager } from '@/services/v2/base/auth/sessionManager'

describe('sessionManager.switchAccount cleanup (ENG-46685)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.removeClient.mockResolvedValue(undefined)
    mocks.pauseQueryPersistence.mockResolvedValue(undefined)
    mocks.clearAllCache.mockResolvedValue(undefined)
  })

  it('clears the account store, runtime cache and persisted cache on switch', async () => {
    await sessionManager.switchAccount()

    expect(mocks.resetCacheSync).toHaveBeenCalled()
    expect(mocks.pauseQueryPersistence).toHaveBeenCalled()
    expect(mocks.resetAccount).toHaveBeenCalled()
    expect(mocks.clearAllCache).toHaveBeenCalled()
    expect(mocks.removeClient).toHaveBeenCalled()
  })

  it('cancels a pending throttled persist before removing the client (no stale rewrite)', async () => {
    await sessionManager.switchAccount()

    const cancelOrder = mocks.cancelPendingPersist.mock.invocationCallOrder[0]
    const removeOrder = mocks.removeClient.mock.invocationCallOrder[0]

    expect(cancelOrder).toBeDefined()
    expect(cancelOrder).toBeLessThan(removeOrder)
  })

  it('does not broadcast to other tabs during switchAccount (broadcast is a separate step)', async () => {
    await sessionManager.switchAccount()

    expect(mocks.sendSwitchAccountBroadcast).not.toHaveBeenCalled()
  })

  it('notifySwitchAccountComplete broadcasts the switch to other tabs', () => {
    sessionManager.notifySwitchAccountComplete()

    expect(mocks.sendSwitchAccountBroadcast).toHaveBeenCalledTimes(1)
  })
})
