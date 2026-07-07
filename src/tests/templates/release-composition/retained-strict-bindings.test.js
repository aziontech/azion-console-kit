import { describe, it, expect } from 'vitest'
import {
  retainedStrictBindings,
  functionBelongsToScope,
  filterScopedRetained
} from '@/templates/release-composition/retained-strict-bindings'

const app = {
  resource_type: 'application',
  resource_id: 10,
  global_id: 'app-10',
  resource_version: 'av1'
}
const fn = {
  resource_type: 'function',
  resource_id: 20,
  resource_name: 'auth-fn',
  resource_version: 'fv1'
}
const connector = {
  resource_type: 'connector',
  resource_id: 30,
  resource_name: 'edge-conn',
  version_id: 'cv2'
}
const composedApp = { resource_type: 'application', resource_id: 10 }

describe('retainedStrictBindings', () => {
  it('returns [] for a FLEXIBLE policy', () => {
    expect(
      retainedStrictBindings({
        activeResources: [app, fn],
        composedResources: [composedApp],
        bindingPolicy: 'FLEXIBLE'
      })
    ).toEqual([])
  })

  it('returns [] when the DS has no active release', () => {
    expect(
      retainedStrictBindings({
        activeResources: [],
        composedResources: [composedApp],
        bindingPolicy: 'STRICT'
      })
    ).toEqual([])
  })

  it('retains a dependency that is in the active release but dropped from the new composition', () => {
    const out = retainedStrictBindings({
      activeResources: [app, fn],
      composedResources: [composedApp],
      bindingPolicy: 'STRICT'
    })
    expect(out).toEqual([
      {
        resource_type: 'function',
        resource_id: 20,
        resource_name: 'auth-fn',
        resource_version: 'fv1'
      }
    ])
  })

  it('does not retain a dependency that is still composed', () => {
    const out = retainedStrictBindings({
      activeResources: [app, fn],
      composedResources: [composedApp, { resource_type: 'function', resource_id: 20 }],
      bindingPolicy: 'STRICT'
    })
    expect(out).toEqual([])
  })

  it('never retains the application singleton', () => {
    const out = retainedStrictBindings({
      activeResources: [app],
      composedResources: [],
      bindingPolicy: 'STRICT'
    })
    expect(out).toEqual([])
  })

  it('preserves the pinned version byte-for-byte, falling back to version_id', () => {
    const out = retainedStrictBindings({
      activeResources: [connector],
      composedResources: [],
      bindingPolicy: 'STRICT'
    })
    expect(out[0].resource_version).toBe('cv2')
  })

  it('dedupes duplicated active entries by resource key', () => {
    const out = retainedStrictBindings({
      activeResources: [fn, { ...fn }],
      composedResources: [],
      bindingPolicy: 'STRICT'
    })
    expect(out).toHaveLength(1)
  })

  it('skips active entries missing a resource_id', () => {
    const out = retainedStrictBindings({
      activeResources: [{ resource_type: 'function', resource_name: 'no-id' }],
      composedResources: [],
      bindingPolicy: 'STRICT'
    })
    expect(out).toEqual([])
  })
})

describe('functionBelongsToScope', () => {
  it('matches when the execution environment equals the scoped type', () => {
    expect(functionBelongsToScope('firewall', 'firewall')).toBe(true)
    expect(functionBelongsToScope('application', 'application')).toBe(true)
  })

  it('rejects a mismatching execution environment', () => {
    expect(functionBelongsToScope('application', 'firewall')).toBe(false)
  })

  it('rejects an unknown (null) execution environment', () => {
    expect(functionBelongsToScope(null, 'firewall')).toBe(false)
    expect(functionBelongsToScope(undefined, 'firewall')).toBe(false)
  })
})

describe('filterScopedRetained', () => {
  const fnFirewall = { resource_type: 'function', resource_id: 1 }
  const fnApp = { resource_type: 'function', resource_id: 2 }
  const conn = { resource_type: 'connector', resource_id: 3 }
  const waf = { resource_type: 'waf', resource_id: 4 }
  const firewallTypes = new Set(['firewall', 'function', 'network_list', 'waf'])
  const appTypes = new Set(['application', 'function', 'connector'])
  const execEnvOf = { 1: 'firewall', 2: 'application' }
  const functionExecEnvFor = (id) => execEnvOf[id] ?? null

  it('returns every resource untouched when showAll is true (non-scoped)', () => {
    const resources = [fnFirewall, fnApp, conn, waf]
    expect(
      filterScopedRetained({ resources, relatedTypes: null, scopedType: null, showAll: true })
    ).toEqual(resources)
  })

  it('drops a type not owned by the scope', () => {
    const out = filterScopedRetained({
      resources: [waf],
      relatedTypes: appTypes,
      scopedType: 'application',
      showAll: false
    })
    expect(out).toEqual([])
  })

  it('keeps only functions whose execution environment matches the scope', () => {
    const out = filterScopedRetained({
      resources: [fnFirewall, fnApp],
      relatedTypes: firewallTypes,
      scopedType: 'firewall',
      showAll: false,
      functionExecEnvFor
    })
    expect(out).toEqual([fnFirewall])
  })

  it('drops a function whose execution environment is unknown', () => {
    const out = filterScopedRetained({
      resources: [{ resource_type: 'function', resource_id: 99 }],
      relatedTypes: firewallTypes,
      scopedType: 'firewall',
      showAll: false,
      functionExecEnvFor
    })
    expect(out).toEqual([])
  })

  it('keeps a connector only when the resolved owned set contains it', () => {
    const out = filterScopedRetained({
      resources: [conn],
      relatedTypes: appTypes,
      scopedType: 'application',
      showAll: false,
      ownedConnectorIdsFor: () => new Set(['3'])
    })
    expect(out).toEqual([conn])
  })

  it('drops a connector absent from the resolved owned set', () => {
    const out = filterScopedRetained({
      resources: [conn],
      relatedTypes: appTypes,
      scopedType: 'application',
      showAll: false,
      ownedConnectorIdsFor: () => new Set(['999'])
    })
    expect(out).toEqual([])
  })

  it('hides a connector while attribution is unresolved (null) or failed', () => {
    const out = filterScopedRetained({
      resources: [conn],
      relatedTypes: appTypes,
      scopedType: 'application',
      showAll: false,
      ownedConnectorIdsFor: () => null
    })
    expect(out).toEqual([])
  })

  it('keeps scoped-owned non-shared types (waf/network_list)', () => {
    const out = filterScopedRetained({
      resources: [waf],
      relatedTypes: firewallTypes,
      scopedType: 'firewall',
      showAll: false
    })
    expect(out).toEqual([waf])
  })
})
