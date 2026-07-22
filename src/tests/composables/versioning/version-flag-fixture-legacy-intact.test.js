import { describe, it, expect, beforeEach } from 'vitest'
import { setFeatureFlags, hasFlagUseV6Configurations } from '@/composables/user-flag'
import { flagGuard } from '@/router/hooks/guards/flagGuard'

const accountWithFlag = { client_flags: ['use_v6_configurations'] }
const accountLegacy = { client_flags: [] }

const v6VersionedRoute = { meta: { flag: 'use_v6_configurations' } }
const legacyRoute = { meta: {} }
const publicRoute = { meta: { isPublic: true } }

beforeEach(() => {
  setFeatureFlags([])
})

describe('client_flags fixture — use_v6_configurations toggle', () => {
  it('reads the flag as ON when present in client_flags', () => {
    setFeatureFlags(accountWithFlag.client_flags)
    expect(hasFlagUseV6Configurations()).toBe(true)
  })

  it('reads the flag as OFF when absent (legacy account)', () => {
    setFeatureFlags(accountLegacy.client_flags)
    expect(hasFlagUseV6Configurations()).toBe(false)
  })

  it('defaults OFF for a malformed client_flags payload', () => {
    setFeatureFlags(undefined)
    expect(hasFlagUseV6Configurations()).toBe(false)
  })
})

describe('flagGuard — v6 versioned-only routes gated by the fixture flag', () => {
  it('blocks the v6 versioned-only route to /not-found when the flag is OFF', () => {
    setFeatureFlags(accountLegacy.client_flags)
    expect(flagGuard({ to: v6VersionedRoute })).toBe('/not-found')
  })

  it('allows the v6 versioned-only route when the flag is ON', () => {
    setFeatureFlags(accountWithFlag.client_flags)
    expect(flagGuard({ to: v6VersionedRoute })).toBe(true)
  })
})

describe('flagGuard — legacy stays intact regardless of the fixture', () => {
  it('never blocks a flag-free (legacy) route, flag ON or OFF', () => {
    setFeatureFlags(accountLegacy.client_flags)
    expect(flagGuard({ to: legacyRoute })).toBe(true)

    setFeatureFlags(accountWithFlag.client_flags)
    expect(flagGuard({ to: legacyRoute })).toBe(true)
  })

  it('never blocks a public route', () => {
    setFeatureFlags(accountLegacy.client_flags)
    expect(flagGuard({ to: publicRoute })).toBe(true)
  })
})
