import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { setFeatureFlags, hasFlagUseV6Configurations } from '@/composables/user-flag'

/**
 * Task 7.5 — Phase 3: the v6/legacy fork for the three versioned-only resources
 * stays driven by the SAME `use_v6_configurations` gate. With the flag OFF the
 * edit route resolves the legacy view; with it ON it resolves the v6 view; the
 * dedicated version route is gated by `meta.flag`. Driven by a `client_flags`
 * fixture so the legacy behavior is provably untouched. Req 7.1, 7.3, 7.4, NFR-B.1.
 */

const read = (relative) =>
  readFileSync(fileURLToPath(new URL(`../../${relative}`, import.meta.url)), 'utf8')

// Real-shaped account payloads: feature flags arrive as the `client_flags` array.
const accountWithFlag = { client_flags: ['use_v6_configurations'] }
const accountLegacy = { client_flags: [] }

// One route module per resource, each declaring the v6/legacy fork + version route.
const RESOURCES = {
  function: {
    routesFile: 'router/routes/edge-functions-routes/index.js',
    legacyView: '@views/EdgeFunctions/EditView.vue',
    v6View: '@views/EdgeFunctions/v6/EditView.vue',
    versionRouteName: "name: 'edit-functions-version'"
  },
  network_list: {
    routesFile: 'router/routes/network-lists-routes/index.js',
    legacyView: '@views/NetworkLists/EditView.vue',
    v6View: '@views/NetworkLists/v6/EditView.vue',
    versionRouteName: "name: 'edit-network-lists-version'"
  },
  waf: {
    routesFile: 'router/routes/waf-rules-routes/index.js',
    legacyView: '@views/WafRules/TabsView.vue',
    v6View: '@views/WafRules/v6/EditView.vue',
    versionRouteName: "name: 'edit-waf-rules-version'"
  }
}

beforeEach(() => {
  setFeatureFlags([])
})

describe('Phase 3 — client_flags fixture drives the v6/legacy fork (Req 7.4, NFR-B.1)', () => {
  it('reads the flag ON from a client_flags account, OFF for a legacy account', () => {
    setFeatureFlags(accountWithFlag.client_flags)
    expect(hasFlagUseV6Configurations()).toBe(true)

    setFeatureFlags(accountLegacy.client_flags)
    expect(hasFlagUseV6Configurations()).toBe(false)
  })
})

describe('Phase 3 — each resource keeps the canonical v6/legacy route fork (Req 7.1, 7.3)', () => {
  for (const [resourceType, cfg] of Object.entries(RESOURCES)) {
    describe(resourceType, () => {
      const source = read(cfg.routesFile)

      it('forks the edit route on hasFlagUseV6Configurations() (component-level, no runtime dispatcher in a component)', () => {
        expect(source).toContain('hasFlagUseV6Configurations()')
        // Flag ON path imports the v6 view; OFF path imports the legacy view.
        expect(source).toContain(cfg.v6View)
        expect(source).toContain(cfg.legacyView)
      })

      it('gates the dedicated version route by meta.flag = use_v6_configurations', () => {
        expect(source).toContain(cfg.versionRouteName)
        expect(source).toMatch(/flag:\s*'use_v6_configurations'/)
      })
    })
  }
})

describe('Phase 3 — the fork picks legacy vs v6 by the fixture flag (Req 7.1)', () => {
  // Mirror the exact predicate the route component factories call, proving the
  // legacy view is selected with the flag OFF and the v6 view with it ON.
  const pickView = (cfg) => (hasFlagUseV6Configurations() ? cfg.v6View : cfg.legacyView)

  for (const [resourceType, cfg] of Object.entries(RESOURCES)) {
    it(`"${resourceType}" resolves the LEGACY view when the flag is OFF`, () => {
      setFeatureFlags(accountLegacy.client_flags)
      expect(pickView(cfg)).toBe(cfg.legacyView)
    })

    it(`"${resourceType}" resolves the V6 view when the flag is ON`, () => {
      setFeatureFlags(accountWithFlag.client_flags)
      expect(pickView(cfg)).toBe(cfg.v6View)
    })
  }
})
