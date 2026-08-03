// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import beforeEachRoute from '@/router/hooks/beforeEachRoute'
import * as guards from '@/router/hooks/guards'

/**
 * beforeEachRoute — the guard PIPELINE itself: execution order, first-answer
 * short-circuit and next() wiring. The guards are this unit's collaborators,
 * so the barrel is the seam here (each guard has its own real-behavior suite
 * in this directory).
 */
const ORDER = [
  'logoutGuard',
  'themeGuard',
  'accountGuard',
  'cliGuard',
  'billingGuard',
  'redirectGuard',
  'flagGuard',
  'realTimeEventsVersionGuard'
]

vi.mock('@/router/hooks/guards', () => ({
  logoutGuard: vi.fn(),
  themeGuard: vi.fn(),
  accountGuard: vi.fn(),
  cliGuard: vi.fn(),
  billingGuard: vi.fn(),
  redirectGuard: vi.fn(),
  flagGuard: vi.fn(),
  realTimeEventsVersionGuard: vi.fn()
}))

const fakeRouter = { getRoutes: () => [] }
vi.mock('vue-router', () => ({ useRouter: () => fakeRouter }))

const to = { name: 'workloads' }
let next

beforeEach(() => {
  vi.clearAllMocks()
  ORDER.forEach((name) => guards[name].mockResolvedValue(undefined))
  next = vi.fn()
})

describe('happy path', () => {
  it('runs every guard in the documented order and proceeds with a bare next()', async () => {
    const calls = []
    ORDER.forEach((name) =>
      guards[name].mockImplementation(async () => {
        calls.push(name)
      })
    )

    await beforeEachRoute({ to, next })

    expect(calls).toEqual(ORDER)
    expect(next).toHaveBeenCalledWith()
  })

  it('hands every guard the shared dependencies plus the router', async () => {
    const accountStore = { id: 'account-store' }

    await beforeEachRoute({ to, next, accountStore })

    ORDER.forEach((name) => {
      expect(guards[name]).toHaveBeenCalledWith({ to, next, accountStore, router: fakeRouter })
    })
  })
})

describe('short-circuit — the first defined answer wins', () => {
  it('stops the chain on a redirect answer and forwards it to next()', async () => {
    guards.billingGuard.mockResolvedValue({ name: 'login' })

    await beforeEachRoute({ to, next })

    expect(next).toHaveBeenCalledWith({ name: 'login' })
    expect(guards.redirectGuard).not.toHaveBeenCalled()
    expect(guards.flagGuard).not.toHaveBeenCalled()
  })

  it('a `false` answer aborts navigation and skips the rest of the chain', async () => {
    guards.redirectGuard.mockResolvedValue(false)

    await beforeEachRoute({ to, next })

    expect(next).toHaveBeenCalledWith(false)
    expect(guards.flagGuard).not.toHaveBeenCalled()
  })

  it('PINNED: even a `true` answer short-circuits — guards after it never run', async () => {
    // billingGuard returns true on public routes, so flag/redirect/rte guards
    // are SKIPPED for them. Behavior is load-bearing; a change must be deliberate.
    guards.cliGuard.mockResolvedValue(true)

    await beforeEachRoute({ to, next })

    expect(next).toHaveBeenCalledWith(true)
    expect(guards.billingGuard).not.toHaveBeenCalled()
  })

  it('next() is called exactly once whatever the outcome', async () => {
    guards.logoutGuard.mockResolvedValue({ name: 'login' })

    await beforeEachRoute({ to, next })

    expect(next).toHaveBeenCalledTimes(1)
  })
})
