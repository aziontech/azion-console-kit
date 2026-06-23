import { describe, expect, it, vi, beforeEach } from 'vitest'

/**
 * Property P5 — v6 version routes are gated by `meta.flag` (task 10.4).
 * For network-lists and waf, the version-editor route carries
 * `meta.flag: 'use_v6_configurations'`; `flagGuard` must redirect to
 * `/not-found` when the flag is absent and let the navigation through when
 * present. Drives the SAME guard the router runs, against the REAL route meta,
 * so a route losing its flag (or the guard regressing) fails here
 * (Req 1.1, 1.4, 1.5, NFR-B.1).
 */

const hasFlagUseV6Configurations = vi.fn()
vi.mock('@/composables/user-flag', () => ({
  hasFlagUseV6Configurations: () => hasFlagUseV6Configurations(),
  hasFlagBlockApiV4: () => false
}))

import { flagGuard } from '@/router/hooks/guards/flagGuard'
import { networkListsRoutes } from '@routes/network-lists-routes'
import { wafRulesRoutes } from '@routes/waf-rules-routes'

const findChild = (route, name) => route.children.find((child) => child.name === name)

const VERSION_ROUTES = [
  {
    name: 'edit-network-lists-version',
    route: findChild(networkListsRoutes, 'edit-network-lists-version')
  },
  {
    name: 'edit-waf-rules-version',
    route: findChild(wafRulesRoutes, 'edit-waf-rules-version')
  }
]

beforeEach(() => {
  hasFlagUseV6Configurations.mockReset()
})

describe('P5 — v6 version routes declare the flag gate', () => {
  it.each(VERSION_ROUTES)('$name carries meta.flag use_v6_configurations', ({ route }) => {
    expect(route).toBeDefined()
    expect(route.meta?.flag).toBe('use_v6_configurations')
  })
})

describe('P5 — flagGuard blocks the version route without the flag', () => {
  it.each(VERSION_ROUTES)('$name redirects to /not-found when flag is off', ({ route }) => {
    hasFlagUseV6Configurations.mockReturnValue(false)

    const result = flagGuard({ to: { meta: route.meta } })

    expect(result).toBe('/not-found')
  })

  it.each(VERSION_ROUTES)('$name is allowed when flag is on', ({ route }) => {
    hasFlagUseV6Configurations.mockReturnValue(true)

    const result = flagGuard({ to: { meta: route.meta } })

    expect(result).toBe(true)
  })
})
