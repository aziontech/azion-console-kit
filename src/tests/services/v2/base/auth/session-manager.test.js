// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/**
 * sessionManager — session lifecycle orchestration (test-maturity deep pass):
 * post-login warmup, account-switch teardown and logout teardown. Mocked
 * seams are the true boundaries only: the IndexedDB persister, the SSE-driven
 * cache-sync loop, the idle-time prefetch scheduler and the cross-tab
 * broadcast. Stores and cache clearing stay real.
 *
 * The module keeps a hasPrefetched run-once flag, so each test re-imports a
 * fresh instance (vi.resetModules).
 */
vi.mock('@/services/v2/base/query/queryPlugin', () => ({
  persister: { removeClient: vi.fn() },
  queryPlugin: {},
  waitForPersistenceRestore: vi.fn(() => Promise.resolve()),
  pauseQueryPersistence: vi.fn(() => Promise.resolve()),
  resumeQueryPersistence: vi.fn(),
  clearAllCacheAndDeleteAzionIndexedDB: vi.fn(() => Promise.resolve()),
  default: {}
}))
vi.mock('@/services/v2/base/cache-sync/cache-sync-service', () => ({
  startCacheSync: vi.fn(),
  resetCacheSync: vi.fn()
}))
vi.mock('@/services/v2/base/query/prefetchScheduler', () => ({
  schedulePrefetch: vi.fn()
}))
vi.mock('@/services/v2/base/auth/session-broadcast', () => ({
  sendSwitchAccountBroadcast: vi.fn(),
  sendLogoutBroadcast: vi.fn(),
  onLogout: vi.fn(),
  onSwitchAccount: vi.fn(),
  stopSessionBroadcast: vi.fn()
}))

const loadSessionManager = async () =>
  (await import('@/services/v2/base/auth/sessionManager')).sessionManager

const loadSeams = async () => ({
  schedulePrefetch: (await import('@/services/v2/base/query/prefetchScheduler')).schedulePrefetch,
  cacheSync: await import('@/services/v2/base/cache-sync/cache-sync-service'),
  persister: (await import('@/services/v2/base/query/queryPlugin')).persister,
  broadcast: await import('@/services/v2/base/auth/session-broadcast')
})

const loginAs = async (kind) => {
  const { useAccountStore } = await import('@/stores/account')
  const accountStore = useAccountStore()
  accountStore.setAccountData({ kind, name: 'someone' })
  return accountStore
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('afterLogin — background warmup', () => {
  it('client account: schedules the background prefetch fleet and starts cache sync', async () => {
    await loginAs('client')
    const sessionManager = await loadSessionManager()
    const { schedulePrefetch, cacheSync } = await loadSeams()

    sessionManager.afterLogin()

    const thunks = schedulePrefetch.mock.calls[0][0]
    expect(thunks.length).toBeGreaterThan(10)
    thunks.forEach((thunk) => expect(typeof thunk).toBe('function'))
    expect(cacheSync.startCacheSync).toHaveBeenCalledTimes(1)
  })

  it('runs the warmup only once per session (second call is a no-op)', async () => {
    await loginAs('client')
    const sessionManager = await loadSessionManager()
    const { schedulePrefetch } = await loadSeams()

    sessionManager.afterLogin()
    sessionManager.afterLogin()

    expect(schedulePrefetch).toHaveBeenCalledTimes(1)
  })

  it('non-client account (reseller): neither prefetches nor starts cache sync', async () => {
    await loginAs('reseller')
    const sessionManager = await loadSessionManager()
    const { schedulePrefetch, cacheSync } = await loadSeams()

    sessionManager.afterLogin()

    expect(schedulePrefetch).not.toHaveBeenCalled()
    expect(cacheSync.startCacheSync).not.toHaveBeenCalled()
  })
})

describe('switchAccount — teardown without broadcast', () => {
  it('wipes local session data but does NOT notify other tabs (race guard)', async () => {
    const accountStore = await loginAs('client')
    const sessionManager = await loadSessionManager()
    const { cacheSync, persister, broadcast } = await loadSeams()

    await sessionManager.switchAccount()

    expect(cacheSync.resetCacheSync).toHaveBeenCalledTimes(1)
    expect(persister.removeClient).toHaveBeenCalledTimes(1)
    expect(accountStore.account).toEqual({})
    expect(broadcast.sendSwitchAccountBroadcast).not.toHaveBeenCalled()
  })

  it('re-arms the warmup: afterLogin works again after a switch', async () => {
    await loginAs('client')
    const sessionManager = await loadSessionManager()
    const { schedulePrefetch } = await loadSeams()

    sessionManager.afterLogin()
    await sessionManager.switchAccount()
    await loginAs('client')
    sessionManager.afterLogin()

    expect(schedulePrefetch).toHaveBeenCalledTimes(2)
  })

  it('notifySwitchAccountComplete is the explicit broadcast step', async () => {
    const sessionManager = await loadSessionManager()
    const { broadcast } = await loadSeams()

    sessionManager.notifySwitchAccountComplete()

    expect(broadcast.sendSwitchAccountBroadcast).toHaveBeenCalledTimes(1)
  })
})

describe('logout — teardown', () => {
  it('wipes cache sync, persisted queries and the account store', async () => {
    const accountStore = await loginAs('client')
    const sessionManager = await loadSessionManager()
    const { cacheSync, persister } = await loadSeams()

    await sessionManager.logout()

    expect(cacheSync.resetCacheSync).toHaveBeenCalledTimes(1)
    expect(persister.removeClient).toHaveBeenCalledTimes(1)
    expect(accountStore.account).toEqual({})
  })
})
