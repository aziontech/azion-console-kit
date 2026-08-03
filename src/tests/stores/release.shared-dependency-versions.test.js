import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useReleaseStore, SHARED_VERSION_DEP_TYPES } from '@/stores/release'
import { LATEST_READY } from '@/templates/release-composition/version-options'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('SHARED_VERSION_DEP_TYPES', () => {
  it('locks version-sharing to connector and network_list', () => {
    expect(SHARED_VERSION_DEP_TYPES).toEqual(['connector', 'network_list'])
  })
})

describe('setCollVer — shared-version propagation', () => {
  it('mirrors a connector version from application to custom_page (same instance)', () => {
    const store = useReleaseStore()
    store.seedApplicationConnectors([{ connectorId: 'cn-1' }])
    store.seedCustomPageConnectors([{ connectorId: 'cn-1' }])

    store.setCollVer('application', 'connector', 0, 'cn-v2')

    expect(store.coll.application.connector[0].version).toBe('cn-v2')
    expect(store.coll.custom_page.connector[0].version).toBe('cn-v2')
  })

  it('propagates in the other direction too (vice versa)', () => {
    const store = useReleaseStore()
    store.seedApplicationConnectors([{ connectorId: 'cn-1' }])
    store.seedCustomPageConnectors([{ connectorId: 'cn-1' }])

    store.setCollVer('custom_page', 'connector', 0, 'cn-v5')

    expect(store.coll.custom_page.connector[0].version).toBe('cn-v5')
    expect(store.coll.application.connector[0].version).toBe('cn-v5')
  })

  it('only touches instances with the SAME resource id, never a different connector', () => {
    const store = useReleaseStore()
    store.seedApplicationConnectors([{ connectorId: 'cn-1' }])
    store.seedCustomPageConnectors([{ connectorId: 'cn-2' }])

    store.setCollVer('application', 'connector', 0, 'cn-v2')

    expect(store.coll.application.connector[0].version).toBe('cn-v2')
    expect(store.coll.custom_page.connector[0].version).toBe(null)
  })

  it('does NOT propagate a non-shared type (function stays independent per parent)', () => {
    const store = useReleaseStore()
    store.seedApplicationFunctions([{ functionId: 'fn-1' }])
    store.seedFirewallFunctions([{ functionId: 'fn-1' }])

    store.setCollVer('application', 'function', 0, 'fn-v2')

    expect(store.coll.application.function[0].version).toBe('fn-v2')
    expect(store.coll.firewall.function[0].version).toBe(null)
  })
})

describe('sharedDependencyParentsFor — the UI "shared with" indicator', () => {
  it('lists the OTHER parents that reference the same shared instance', () => {
    const store = useReleaseStore()
    store.seedApplicationConnectors([{ connectorId: 'cn-1' }])
    store.seedCustomPageConnectors([{ connectorId: 'cn-1' }])

    expect(store.sharedDependencyParentsFor('connector', 'cn-1', 'application')).toEqual([
      'custom_page'
    ])
    expect(store.sharedDependencyParentsFor('connector', 'cn-1', 'custom_page')).toEqual([
      'application'
    ])
  })

  it('returns [] when the instance is referenced by a single parent', () => {
    const store = useReleaseStore()
    store.seedApplicationConnectors([{ connectorId: 'cn-1' }])

    expect(store.sharedDependencyParentsFor('connector', 'cn-1', 'application')).toEqual([])
  })

  it('returns [] for a non-shared type even when it lives under two parents', () => {
    const store = useReleaseStore()
    store.seedApplicationFunctions([{ functionId: 'fn-1' }])
    store.seedFirewallFunctions([{ functionId: 'fn-1' }])

    expect(store.sharedDependencyParentsFor('function', 'fn-1', 'application')).toEqual([])
  })
})

describe('reconcileSharedVersions — seed-timing convergence', () => {
  it('a parent seeded LATER inherits the sibling version via restoreCollVersions', () => {
    const store = useReleaseStore()
    store.seedApplicationConnectors([{ connectorId: 'cn-1' }])
    store.setCollVer('application', 'connector', 0, 'cn-v2')

    store.seedCustomPageConnectors([{ connectorId: 'cn-1' }])
    store.restoreCollVersions({ 'application:connector:cn-1': 'cn-v2' })

    expect(store.coll.application.connector[0].version).toBe('cn-v2')
    expect(store.coll.custom_page.connector[0].version).toBe('cn-v2')
  })

  it('a concrete pinned version wins over the LATEST sentinel across parents', () => {
    const store = useReleaseStore()
    store.seedApplicationConnectors([{ connectorId: 'cn-1' }])
    store.seedCustomPageConnectors([{ connectorId: 'cn-1' }])
    store.coll.application.connector[0].version = 'cn-v3'
    store.coll.custom_page.connector[0].version = LATEST_READY

    store.reconcileSharedVersions()

    expect(store.coll.application.connector[0].version).toBe('cn-v3')
    expect(store.coll.custom_page.connector[0].version).toBe('cn-v3')
  })
})

describe('composeResources — shared connector ships once with the synced version', () => {
  it('dedupes to a single flat entry carrying the shared version', () => {
    const store = useReleaseStore()
    store.openRelease({ deploymentIds: ['ds-1'] })
    store.setResName('application', 'app-1')
    store.setResVer('application', 'app-v1')
    store.setVersionsByResource('application', 'app-1', [{ value: 'app-v1', isCurrent: true }])

    store.seedApplicationConnectors([{ connectorId: 'cn-1' }])
    store.seedCustomPageConnectors([{ connectorId: 'cn-1' }])
    store.setVersionsByResource('connector', 'cn-1', [{ value: 'cn-v2', isCurrent: true }])
    store.setCollVer('application', 'connector', 0, 'cn-v2')

    const connectorEntries = store
      .composeResources()
      .filter((res) => res.resource_type === 'connector' && res.resource_id === 'cn-1')

    expect(connectorEntries).toHaveLength(1)
    expect(connectorEntries[0].resource_version).toBe('cn-v2')
  })
})
