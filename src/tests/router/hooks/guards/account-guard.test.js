import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountGuard } from '@/router/hooks/guards/accountGuard'

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
  // The no-session branch has a debug-only escape hatch gated on VITE_DEBUG_LOGIN
  // (accountGuard.js). These tests cover the PRODUCTION redirect path, so pin the
  // flag off — otherwise a local `.env.local` with VITE_DEBUG_LOGIN=true makes the
  // guard take the debug branch and the outcome is env-dependent.
  beforeEach(() => {
    vi.stubEnv('VITE_DEBUG_LOGIN', 'false')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should redirect to login without calling API when hasSession=false', async () => {
    const { loadUserAndAccountInfo } = await import('@/helpers/account-data')

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: { hasActiveUserId: false, hasSession: false },
      tracker: { reset: vi.fn() }
    })

    expect(loadUserAndAccountInfo).not.toHaveBeenCalled()
    expect(result).toBe('/login')
  })

  it('should attempt session restore when hasSession=true', async () => {
    const { loadUserAndAccountInfo } = await import('@/helpers/account-data')
    loadUserAndAccountInfo.mockResolvedValue(undefined)

    const result = await accountGuard({
      to: { meta: { isPublic: false }, fullPath: '/products' },
      accountStore: { hasActiveUserId: false, hasSession: true },
      tracker: { reset: vi.fn() }
    })

    expect(loadUserAndAccountInfo).toHaveBeenCalled()
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
