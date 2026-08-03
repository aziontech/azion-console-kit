import { describe, it, expect } from 'vitest'
import { flagGuard } from '@/router/hooks/guards/flagGuard'
import { flagOn, flagOff, installFlagReset, FLAG_NAME } from '../support/flag-v6'

/**
 * Gated v6 routes × the REAL flagGuard (spec flag-v6-coverage, req 3 / ADR-3).
 *
 * The gated-route set is DERIVED by scanning the real route definitions — no
 * manual list (req 3.3): a new `meta.flag: 'use_v6_configurations'` route joins
 * these tests by existing. Both modes proven: flag OFF → '/not-found'; ON →
 * navigation allowed.
 */
const routeModules = import.meta.glob('/src/router/routes/*/index.js', { eager: true })

const flattenRoutes = (node) => [node, ...(node.children ?? []).flatMap(flattenRoutes)]

const gatedRoutes = Object.values(routeModules)
  .flatMap((mod) => Object.values(mod).filter((value) => value && typeof value === 'object'))
  .flatMap(flattenRoutes)
  .filter((record) => record?.meta?.flag === FLAG_NAME)

installFlagReset()

describe('scan of real route definitions (no manual list — req 3.3)', () => {
  it('finds the v6-gated routes in the route tree', () => {
    expect(gatedRoutes.length).toBeGreaterThan(0)
    // Every gated record is a real, named route — a scan artifact would fail here.
    for (const route of gatedRoutes) {
      expect(route.name, 'gated route must have a name').toBeTruthy()
    }
  })
})

describe('flagGuard blocks every gated route for a legacy account (req 3.1)', () => {
  for (const route of gatedRoutes) {
    it(`"${String(route.name)}": flag OFF redirects to /not-found`, () => {
      flagOff()
      expect(flagGuard({ to: route })).toBe('/not-found')
    })
  }
})

describe('flagGuard allows every gated route with the flag ON (req 3.2)', () => {
  for (const route of gatedRoutes) {
    it(`"${String(route.name)}": flag ON allows navigation`, () => {
      flagOn()
      expect(flagGuard({ to: route })).toBe(true)
    })
  }
})

describe('flagGuard contract edges', () => {
  it('a public route bypasses the gate even with the flag OFF (documented guard behavior)', () => {
    flagOff()
    expect(flagGuard({ to: { meta: { isPublic: true, flag: FLAG_NAME } } })).toBe(true)
  })

  it('a route without meta.flag is not gated in either mode', () => {
    flagOff()
    expect(flagGuard({ to: { meta: {} } })).toBe(true)
    flagOn()
    expect(flagGuard({ to: { meta: {} } })).toBe(true)
  })
})
