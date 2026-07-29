import { describe, expect, it, vi, beforeEach } from 'vitest'
import { accountGuard } from '@/router/hooks/guards/accountGuard'

// Hermetic: a dev's .env.local with VITE_DEBUG_LOGIN=true flips the guard into
// its debug branch and breaks these assertions. Tests must not depend on it.
vi.stubEnv('VITE_DEBUG_LOGIN', 'false')

vi.mock('@/helpers/account-data', () => ({
  loadUserAndAccountInfo: vi.fn()
}))

vi.mock('@/helpers', () => ({
  setRedirectRoute: vi.fn()
}))

vi.mock('@/services/v2/base/auth', () => ({
  sessionManager: {
    logout: vi.fn().mockResolvedValue(undefined),
    afterLogin: vi.fn()
  }
}))

describe('accountGuard hasSession check', () => {
  it('should redirect to login without calling API when hasSession=false', async () => {
    const { loadUserAndAccountInfo } = await import('@/helpers/account-data')
    const { sessionManager } = await import('@/services/v2/base/auth')
    loadUserAndAccountInfo.mockClear()
    sessionManager.afterLogin.mockClear()

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: { hasActiveUserId: false, hasSession: false },
      tracker: { reset: vi.fn() }
    })

    expect(loadUserAndAccountInfo).not.toHaveBeenCalled()
    expect(sessionManager.afterLogin).not.toHaveBeenCalled()
    expect(result).toBe('/login')
  })

  it('should attempt session restore when hasSession=true', async () => {
    const { loadUserAndAccountInfo } = await import('@/helpers/account-data')
    const { sessionManager } = await import('@/services/v2/base/auth')
    loadUserAndAccountInfo.mockReset()
    loadUserAndAccountInfo.mockResolvedValue(undefined)
    sessionManager.afterLogin.mockClear()

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        accountData: { id: 1 }
      },
      tracker: { reset: vi.fn() }
    })

    expect(loadUserAndAccountInfo).toHaveBeenCalled()
    expect(sessionManager.afterLogin).toHaveBeenCalledOnce()
    expect(result).toBeUndefined()
  })

  it('should not interfere when user is already logged in', async () => {
    const { loadUserAndAccountInfo } = await import('@/helpers/account-data')
    loadUserAndAccountInfo.mockClear()

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: { hasActiveUserId: true, hasSession: true },
      tracker: { reset: vi.fn() }
    })

    expect(loadUserAndAccountInfo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should not interfere on public routes', async () => {
    const { loadUserAndAccountInfo } = await import('@/helpers/account-data')
    loadUserAndAccountInfo.mockClear()

    const result = await accountGuard({
      to: { meta: { isPublic: true }, fullPath: '/login' },
      accountStore: { hasActiveUserId: false, hasSession: false },
      tracker: { reset: vi.fn() }
    })

    expect(loadUserAndAccountInfo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})

describe('accountGuard onboarding decision (first_login)', () => {
  const runGuard = async (accountStore, to = { meta: { isPublic: false }, name: 'home' }) =>
    accountGuard({
      to: { fullPath: '/', ...to },
      accountStore: { hasSession: true, accountData: { id: 1 }, ...accountStore },
      tracker: { reset: vi.fn() }
    })

  beforeEach(async () => {
    const { loadUserAndAccountInfo } = await import('@/helpers/account-data')
    loadUserAndAccountInfo.mockReset()
    loadUserAndAccountInfo.mockResolvedValue(undefined)
  })

  it('redirects a first-login account to onboarding right after hydration', async () => {
    const result = await runGuard({ hasActiveUserId: false, isFirstLogin: true })

    expect(result).toEqual({ name: 'additional-data' })
  })

  it('redirects a first-login account that is already hydrated', async () => {
    const { loadUserAndAccountInfo } = await import('@/helpers/account-data')

    const result = await runGuard({ hasActiveUserId: true, isFirstLogin: true })

    expect(loadUserAndAccountInfo).not.toHaveBeenCalled()
    expect(result).toEqual({ name: 'additional-data' })
  })

  it('does not bounce when the target already is the onboarding route', async () => {
    const result = await runGuard(
      { hasActiveUserId: true, isFirstLogin: true },
      { meta: { isPublic: false }, name: 'additional-data' }
    )

    expect(result).toBeUndefined()
  })

  it('leaves a returning account alone', async () => {
    expect(await runGuard({ hasActiveUserId: true, isFirstLogin: false })).toBeUndefined()
  })

  it('leaves an account without the first_login field alone', async () => {
    expect(await runGuard({ hasActiveUserId: true, isFirstLogin: undefined })).toBeUndefined()
  })

  it('never redirects on a public route', async () => {
    const result = await runGuard(
      { hasActiveUserId: true, isFirstLogin: true },
      { meta: { isPublic: true }, name: 'login' }
    )

    expect(result).toBeUndefined()
  })

  it('does not read the billing surface to decide a redirect', async () => {
    const { subscriptionsService } =
      await import('@/services/v2/billing-api/subscriptions/subscriptions-service')
    const spy = vi.spyOn(subscriptionsService, 'getCurrentSubscription')

    await runGuard({ hasActiveUserId: false, isFirstLogin: false })

    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('accountGuard failure path', () => {
  it('logs out and redirects to login when hydration fails', async () => {
    const { loadUserAndAccountInfo } = await import('@/helpers/account-data')
    const { sessionManager } = await import('@/services/v2/base/auth')
    loadUserAndAccountInfo.mockReset()
    loadUserAndAccountInfo.mockRejectedValue(new Error('401'))
    sessionManager.logout.mockClear()
    const reset = vi.fn()

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: { hasActiveUserId: false, hasSession: true },
      tracker: { reset }
    })

    expect(reset).toHaveBeenCalledOnce()
    expect(sessionManager.logout).toHaveBeenCalledOnce()
    expect(result).toBe('/login')
  })
})
