import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { logoutGuard } from '@/router/hooks/guards/logoutGuard'
import { useLoadingStore } from '@/stores/loading'
import { useAccountStore } from '@/stores/account'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

/**
 * logoutGuard — the session-teardown path: local caches wiped, server session
 * killed, account reset, user sent to login. Seams are the two real
 * boundaries: the HTTP adapter and the IndexedDB persister (jsdom has no
 * IndexedDB).
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

const tracker = { reset: vi.fn() }
let requestSpy

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  requestSpy = vi
    .spyOn(AxiosHttpClientAdapter, 'request')
    .mockResolvedValue({ statusCode: 200, body: {} })
})

describe('regular navigation', () => {
  it('starts the global loading bar and stays silent', async () => {
    const result = await logoutGuard({
      to: { path: '/workloads', query: {}, meta: {} },
      accountStore: useAccountStore(),
      tracker
    })

    expect(result).toBeUndefined()
    expect(useLoadingStore().showLoading).toBe(true)
    expect(requestSpy).not.toHaveBeenCalled()
  })

  it('finishes the loading bar for routes flagged hideLoading', async () => {
    await logoutGuard({
      to: { path: '/workloads', query: {}, meta: { hideLoading: true } },
      accountStore: useAccountStore(),
      tracker
    })

    expect(useLoadingStore().showLoading).toBe(false)
  })
})

describe('logout teardown', () => {
  const runLogout = async (to) => {
    const accountStore = useAccountStore()
    accountStore.setAccountData({ name: 'someone', utc_offset: '+0000' })
    const result = await logoutGuard({ to, accountStore, tracker })
    return { result, accountStore }
  }

  it('kills the server session, wipes local persistence and lands on login', async () => {
    const { result, accountStore } = await runLogout({
      path: '/logout',
      query: {},
      meta: {}
    })
    const { persister } = await import('@/services/v2/base/query/queryPlugin')

    expect(result).toEqual({ name: 'login' })
    expect(tracker.reset).toHaveBeenCalledTimes(1)
    expect(requestSpy.mock.calls[0][0]).toMatchObject({ method: 'POST' })
    expect(requestSpy.mock.calls[0][0].url).toContain('logout')
    expect(persister.removeClient).toHaveBeenCalled()
    expect(accountStore.account).toEqual({})
  })

  it('also triggers on any route carrying ?ref=logout', async () => {
    const { result } = await runLogout({
      path: '/workloads',
      query: { ref: 'logout' },
      meta: {}
    })

    expect(result).toEqual({ name: 'login' })
    expect(requestSpy.mock.calls[0][0].url).toContain('logout')
  })
})
