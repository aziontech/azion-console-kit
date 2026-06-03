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

vi.mock('@/services/v2/service-orders/service-orders-constants', () => ({
  SO_ENTITLED_STATUSES: ['ACTIVE', 'PAST_DUE', 'BLOCKED']
}))

describe('accountGuard hasSession check', () => {
  it('should redirect to login without calling API when hasSession=false', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: { hasActiveUserId: false, hasSession: false },
      tracker: { reset: vi.fn() }
    })

    expect(loadAccountHydration).not.toHaveBeenCalled()
    expect(result).toBe('/login')
  })

  it('should attempt session restore when hasSession=true', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    loadAccountHydration.mockResolvedValue(undefined)

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        needsOnboarding: false,
        accountData: { id: 1 },
        setHasActivePlan: vi.fn()
      },
      tracker: { reset: vi.fn() }
    })

    expect(loadAccountHydration).toHaveBeenCalled()
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
    loadAccountHydration.mockResolvedValue(undefined)
    ensurePlansList.mockClear()

    const result = await accountGuard({
      to: { meta: { isPublic: false }, name: 'home', fullPath: '/' },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        needsOnboarding: true,
        accountData: { id: 1 },
        setHasActivePlan: vi.fn()
      },
      tracker: { reset: vi.fn() }
    })

    expect(ensurePlansList).toHaveBeenCalledOnce()
    expect(result).toEqual({ name: 'additional-data' })
  })

  it('does not prefetch when already on additional-data route', async () => {
    const { loadAccountHydration } = await import('@/helpers/account-data')
    const { ensurePlansList } = await import('@/composables/usePlansService')
    loadAccountHydration.mockResolvedValue(undefined)
    ensurePlansList.mockClear()

    const result = await accountGuard({
      to: { meta: { isPublic: false }, name: 'additional-data', fullPath: '/signup/additional-data' },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        needsOnboarding: true,
        accountData: { id: 1 },
        setHasActivePlan: vi.fn()
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
        accountData: { id: 1 },
        setHasActivePlan: vi.fn()
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
        accountData: { id: 1 },
        setHasActivePlan: vi.fn()
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

  const runGuard = async (orders, setHasActivePlan) => {
    const { ensureServiceOrdersList } = await import('@/composables/useServiceOrdersList')
    ensureServiceOrdersList.mockResolvedValueOnce({ data: orders })

    await accountGuard({
      to: { meta: { isPublic: false }, name: 'home', fullPath: '/' },
      accountStore: {
        hasActiveUserId: false,
        hasSession: true,
        needsOnboarding: false,
        accountData: { id: 1 },
        setHasActivePlan
      },
      tracker: { reset: vi.fn() }
    })
  }

  it('treats DRAFT-only as no active plan so onboarding still triggers', async () => {
    const setHasActivePlan = vi.fn()
    await runGuard([{ status: 'DRAFT' }], setHasActivePlan)
    expect(setHasActivePlan).toHaveBeenCalledWith(false)
  })

  it('treats ACTIVE as active plan', async () => {
    const setHasActivePlan = vi.fn()
    await runGuard([{ status: 'ACTIVE' }], setHasActivePlan)
    expect(setHasActivePlan).toHaveBeenCalledWith(true)
  })

  it('treats PAST_DUE and BLOCKED as active plan (still entitled)', async () => {
    const setHasActivePlanPastDue = vi.fn()
    await runGuard([{ status: 'PAST_DUE' }], setHasActivePlanPastDue)
    expect(setHasActivePlanPastDue).toHaveBeenCalledWith(true)

    const setHasActivePlanBlocked = vi.fn()
    await runGuard([{ status: 'BLOCKED' }], setHasActivePlanBlocked)
    expect(setHasActivePlanBlocked).toHaveBeenCalledWith(true)
  })

  it('treats CANCELED and EXPIRED as no active plan', async () => {
    const setHasActivePlan = vi.fn()
    await runGuard([{ status: 'CANCELED' }, { status: 'EXPIRED' }], setHasActivePlan)
    expect(setHasActivePlan).toHaveBeenCalledWith(false)
  })

  it('treats DRAFT + CANCELED as no active plan', async () => {
    const setHasActivePlan = vi.fn()
    await runGuard([{ status: 'DRAFT' }, { status: 'CANCELED' }], setHasActivePlan)
    expect(setHasActivePlan).toHaveBeenCalledWith(false)
  })

  it('treats DRAFT + ACTIVE as active plan (ACTIVE wins)', async () => {
    const setHasActivePlan = vi.fn()
    await runGuard([{ status: 'DRAFT' }, { status: 'ACTIVE' }], setHasActivePlan)
    expect(setHasActivePlan).toHaveBeenCalledWith(true)
  })
})
