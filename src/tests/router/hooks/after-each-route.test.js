import { describe, expect, it, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@sentry/vue', () => ({
  captureException: vi.fn()
}))

vi.mock('@/services/v2/base/auth', () => ({
  sessionManager: {
    afterLogin: vi.fn()
  }
}))

vi.mock('@/stores/loading', () => ({
  useLoadingStore: () => ({ finishLoading: vi.fn() })
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: vi.fn()
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return { ...actual, inject: vi.fn() }
})

const buildTracker = () => {
  const pageTrack = vi.fn()
  return {
    tracker: {
      product: { pageLoad: vi.fn(() => ({ track: pageTrack })) },
      identify: vi.fn(),
      page: vi.fn().mockResolvedValue(undefined)
    },
    pageTrack
  }
}

describe('afterEachRoute prefetch gate', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const { sessionManager } = await import('@/services/v2/base/auth')
    const { useAccountStore } = await import('@/stores/account')
    const { inject } = await import('vue')

    sessionManager.afterLogin.mockClear()
    useAccountStore.mockReturnValue({ hasActiveUserId: true, userId: 'user-1' })
    inject.mockReturnValue(buildTracker().tracker)
  })

  it('skips afterLogin on the additional-data onboarding step', async () => {
    const { default: afterEachRoute } = await import('@/router/hooks/afterEachRoute')
    const { sessionManager } = await import('@/services/v2/base/auth')

    afterEachRoute(
      { name: 'additional-data', fullPath: '/signup/additional-data', meta: { isPublic: true } },
      {},
      null
    )

    expect(sessionManager.afterLogin).not.toHaveBeenCalled()
  })

  it('skips afterLogin on public routes (signup, login, etc.)', async () => {
    const { default: afterEachRoute } = await import('@/router/hooks/afterEachRoute')
    const { sessionManager } = await import('@/services/v2/base/auth')

    afterEachRoute(
      { name: 'signup', fullPath: '/signup', meta: { isPublic: true } },
      {},
      null
    )

    expect(sessionManager.afterLogin).not.toHaveBeenCalled()
  })

  it('calls afterLogin on private internal routes (e.g. home)', async () => {
    const { default: afterEachRoute } = await import('@/router/hooks/afterEachRoute')
    const { sessionManager } = await import('@/services/v2/base/auth')

    afterEachRoute({ name: 'home', fullPath: '/', meta: { isPublic: false } }, {}, null)

    expect(sessionManager.afterLogin).toHaveBeenCalledOnce()
  })

  it('does not call afterLogin when user is not logged in', async () => {
    const { default: afterEachRoute } = await import('@/router/hooks/afterEachRoute')
    const { sessionManager } = await import('@/services/v2/base/auth')
    const { useAccountStore } = await import('@/stores/account')
    useAccountStore.mockReturnValue({ hasActiveUserId: false, userId: null })

    afterEachRoute({ name: 'home', fullPath: '/', meta: { isPublic: false } }, {}, null)

    expect(sessionManager.afterLogin).not.toHaveBeenCalled()
  })
})
