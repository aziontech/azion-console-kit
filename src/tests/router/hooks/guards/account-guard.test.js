import { describe, expect, it, vi, beforeEach } from 'vitest'
import { accountGuard } from '@/router/hooks/guards/accountGuard'

vi.mock('@/helpers/account-data', () => ({
  loadAccountHydration: vi.fn()
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

vi.mock('@/composables/usePlansService', () => ({
  ensurePlansList: vi.fn().mockResolvedValue([])
}))

vi.mock('@/composables/useServiceOrdersList', () => ({
  ensureServiceOrdersList: vi.fn(async () => ({ data: [] }))
}))

describe('accountGuard hasSession check', () => {
  it('should redirect to login without calling API when hasSession=false', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    const { sessionManager } = await import('@/services/v2/base/auth')

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: { hasActiveUserId: false, hasSession: false },
      tracker: { reset: vi.fn() }
    })

    expect(loadAccountHydration).not.toHaveBeenCalled()
    expect(sessionManager.afterLogin).not.toHaveBeenCalled()
    expect(result).toBe('/login')
  })

  it('should attempt session restore when hasSession=true', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    const { sessionManager } = await import('@/services/v2/base/auth')
    loadAccountHydration.mockResolvedValue(undefined)
    sessionManager.afterLogin.mockClear()

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        needsOnboarding: false,
        accountData: { id: 1 }
      },
      tracker: { reset: vi.fn() }
    })

    expect(loadAccountHydration).toHaveBeenCalled()
    expect(sessionManager.afterLogin).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should not interfere when user is already logged in', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    loadAccountHydration.mockClear()

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: { hasActiveUserId: true, hasSession: true },
      tracker: { reset: vi.fn() }
    })

    expect(loadAccountHydration).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('should not interfere on public routes', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    loadAccountHydration.mockClear()

    const result = await accountGuard({
      to: { meta: { isPublic: true }, fullPath: '/login' },
      accountStore: { hasActiveUserId: false, hasSession: false },
      tracker: { reset: vi.fn() }
    })

    expect(loadAccountHydration).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})

describe('accountGuard onboarding prefetch', () => {
  beforeEach(async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    const { ensurePlansList } = await import('@/composables/usePlansService')
    loadAccountHydration.mockReset()
    loadAccountHydration.mockResolvedValue(undefined)
    ensurePlansList.mockReset()
    ensurePlansList.mockResolvedValue([])
  })

  it('prefetches plans when redirecting to additional-data (needsOnboarding=true)', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    const { ensurePlansList } = await import('@/composables/usePlansService')
    const { sessionManager } = await import('@/services/v2/base/auth')
    loadAccountHydration.mockResolvedValue(undefined)
    ensurePlansList.mockClear()
    sessionManager.afterLogin.mockClear()

    const result = await accountGuard({
      to: { meta: { isPublic: false }, name: 'home', fullPath: '/' },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        needsOnboarding: true,
        accountData: { id: 1 }
      },
      tracker: { reset: vi.fn() }
    })

    expect(ensurePlansList).toHaveBeenCalledOnce()
    expect(sessionManager.afterLogin).not.toHaveBeenCalled()
    expect(result).toEqual({ name: 'additional-data' })
  })

  it('does not prefetch when already on additional-data route', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    const { ensurePlansList } = await import('@/composables/usePlansService')
    loadAccountHydration.mockResolvedValue(undefined)
    ensurePlansList.mockClear()

    const result = await accountGuard({
      to: {
        meta: { isPublic: false },
        name: 'additional-data',
        fullPath: '/signup/additional-data'
      },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        needsOnboarding: true,
        accountData: { id: 1 }
      },
      tracker: { reset: vi.fn() }
    })

    expect(ensurePlansList).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('does not prefetch when needsOnboarding=false', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    const { ensurePlansList } = await import('@/composables/usePlansService')
    loadAccountHydration.mockResolvedValue(undefined)
    ensurePlansList.mockClear()

    await accountGuard({
      to: { meta: { isPublic: false }, name: 'home', fullPath: '/' },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        needsOnboarding: false,
        accountData: { id: 1 }
      },
      tracker: { reset: vi.fn() }
    })

    expect(ensurePlansList).not.toHaveBeenCalled()
  })

  it('swallows prefetch failures so the redirect is not blocked', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    const { ensurePlansList } = await import('@/composables/usePlansService')
    loadAccountHydration.mockResolvedValue(undefined)
    ensurePlansList.mockClear()
    ensurePlansList.mockRejectedValueOnce(new Error('network'))

    const result = await accountGuard({
      to: { meta: { isPublic: false }, name: 'home', fullPath: '/' },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        needsOnboarding: true,
        accountData: { id: 1 }
      },
      tracker: { reset: vi.fn() }
    })

    expect(result).toEqual({ name: 'additional-data' })
  })
})

describe('accountGuard hasActivePlan derivation', () => {
  beforeEach(async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    const { ensureServiceOrdersList } = await import('@/composables/useServiceOrdersList')
    loadAccountHydration.mockReset()
    loadAccountHydration.mockResolvedValue(undefined)
    ensureServiceOrdersList.mockReset()
  })

  const runGuard = async () => {
    const { ensureServiceOrdersList } = await import('@/composables/useServiceOrdersList')

    await accountGuard({
      to: { meta: { isPublic: false }, name: 'home', fullPath: '/' },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        needsOnboarding: false,
        accountData: { id: 1 }
      },
      tracker: { reset: vi.fn() }
    })

    return { ensureServiceOrdersList }
  }

  it('does not load service orders during session restore', async () => {
    const { ensureServiceOrdersList } = await runGuard()

    expect(ensureServiceOrdersList).not.toHaveBeenCalled()
  })
})
