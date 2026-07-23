// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { billingGuard } from '@/router/hooks/guards/billingGuard'

/**
 * billingGuard — access gate for /billing and the payment-review lockdown
 * (test-maturity deep pass: money-path navigation, previously untested).
 * The guard is pure over its injected accountStore snapshot.
 */
const to = (fullPath, meta = {}) => ({ fullPath, meta })
const store = (overrides = {}) => ({
  hasActiveUserId: true,
  billingAccessPermitted: true,
  paymentReviewPending: false,
  ...overrides
})

describe('bypasses', () => {
  it('lets public routes through untouched', () => {
    const result = billingGuard({
      to: to('/billing/bills', { isPublic: true }),
      accountStore: store()
    })
    expect(result).toBe(true)
  })

  it('lets unauthenticated navigation through (login flow owns it)', () => {
    const result = billingGuard({
      to: to('/billing/bills'),
      accountStore: store({ hasActiveUserId: false })
    })
    expect(result).toBe(true)
  })
})

describe('billing routes', () => {
  it('blocks /billing for accounts without billing access, sending them home', () => {
    const result = billingGuard({
      to: to('/billing/bills'),
      accountStore: store({ billingAccessPermitted: false })
    })
    expect(result).toBe('/')
  })

  it('allows /billing for accounts with billing access', () => {
    const result = billingGuard({ to: to('/billing/bills'), accountStore: store() })
    expect(result).toBe(true)
  })
})

describe('payment-review lockdown', () => {
  it('redirects ANY non-billing navigation to the bills page while payment review is pending', () => {
    const result = billingGuard({
      to: to('/workloads'),
      accountStore: store({ paymentReviewPending: true })
    })
    expect(result).toEqual({ path: '/billing/bills', query: { paymentSession: 'true' } })
  })

  it('stays silent (undefined) on normal navigation with a healthy account', () => {
    const result = billingGuard({ to: to('/workloads'), accountStore: store() })
    expect(result).toBeUndefined()
  })
})
