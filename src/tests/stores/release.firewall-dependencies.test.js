import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useReleaseStore } from '@/stores/release'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('seedFirewallFunctions — firewall-required function dependencies', () => {
  it('maps each functionId to a locked, required, version:null entry under coll.function', () => {
    const store = useReleaseStore()

    store.seedFirewallFunctions([{ functionId: 'fn-100' }, { functionId: 'fn-200' }])

    expect(store.coll.function).toEqual([
      { resourceId: 'fn-100', version: null, locked: true, required: true },
      { resourceId: 'fn-200', version: null, locked: true, required: true }
    ])
  })

  it('dedups by functionId and skips null ids', () => {
    const store = useReleaseStore()

    store.seedFirewallFunctions([
      { functionId: 'fn-100' },
      { functionId: null },
      { functionId: 'fn-100' }
    ])

    expect(store.coll.function).toEqual([
      { resourceId: 'fn-100', version: null, locked: true, required: true }
    ])
  })

  it('replaces ONLY coll.function and leaves other coll keys untouched', () => {
    const store = useReleaseStore()
    store.seedColl({
      connector: [{ resourceId: 'cn-9', version: 'cn-v1' }],
      waf: [{ resourceId: 'waf-2', version: 'waf-v5' }]
    })

    store.seedFirewallFunctions([{ functionId: 'fn-100' }])

    expect(store.coll.function).toEqual([
      { resourceId: 'fn-100', version: null, locked: true, required: true }
    ])
    expect(store.coll.connector).toEqual([{ resourceId: 'cn-9', version: 'cn-v1' }])
    expect(store.coll.waf).toEqual([{ resourceId: 'waf-2', version: 'waf-v5' }])
  })
})

describe('seedFirewallWafs — firewall-required waf dependencies', () => {
  it('maps each wafId to a locked, required, version:null entry under coll.waf', () => {
    const store = useReleaseStore()

    store.seedFirewallWafs([
      { wafId: 'waf-100', ruleCount: 3 },
      { wafId: 'waf-200', ruleCount: 1 }
    ])

    expect(store.coll.waf).toEqual([
      { resourceId: 'waf-100', version: null, locked: true, required: true },
      { resourceId: 'waf-200', version: null, locked: true, required: true }
    ])
  })

  it('dedups by wafId and skips null ids', () => {
    const store = useReleaseStore()

    store.seedFirewallWafs([{ wafId: 'waf-1' }, { wafId: null }, { wafId: 'waf-1' }])

    expect(store.coll.waf).toEqual([
      { resourceId: 'waf-1', version: null, locked: true, required: true }
    ])
  })

  it('clears coll.waf when given a non-array argument', () => {
    const store = useReleaseStore()
    store.seedFirewallWafs([{ wafId: 'waf-1' }])

    store.seedFirewallWafs(null)

    expect(store.coll.waf).toEqual([])
  })
})

describe('seedFirewallNetworkLists — firewall-required network list dependencies', () => {
  it('maps each networkListId to a locked, required, version:null entry under coll.network_list', () => {
    const store = useReleaseStore()

    store.seedFirewallNetworkLists([{ networkListId: 30, ruleCount: 2 }, { networkListId: 40 }])

    expect(store.coll.network_list).toEqual([
      { resourceId: 30, version: null, locked: true, required: true },
      { resourceId: 40, version: null, locked: true, required: true }
    ])
  })

  it('dedups by networkListId and skips null ids', () => {
    const store = useReleaseStore()

    store.seedFirewallNetworkLists([
      { networkListId: 30 },
      { networkListId: null },
      { networkListId: 30 }
    ])

    expect(store.coll.network_list).toEqual([
      { resourceId: 30, version: null, locked: true, required: true }
    ])
  })
})

describe('firewall dependencies — deploy gate getters', () => {
  it('appManagedVersionsChosen is false while a required firewall dependency has no concrete version', () => {
    const store = useReleaseStore()
    store.seedFirewallWafs([{ wafId: 'waf-1' }])
    store.seedFirewallNetworkLists([{ networkListId: 30 }])

    expect(store.appManagedVersionsChosen).toBe(false)
  })

  it('pendingDependencySelections lists every unpicked required firewall dependency', () => {
    const store = useReleaseStore()
    store.seedFirewallWafs([{ wafId: 'waf-1' }])
    store.seedFirewallNetworkLists([{ networkListId: 30 }])

    expect(store.pendingDependencySelections).toEqual([
      { type: 'waf', resourceId: 'waf-1' },
      { type: 'network_list', resourceId: 30 }
    ])
  })

  it('appManagedVersionsChosen becomes true once every firewall dependency has a concrete version', () => {
    const store = useReleaseStore()
    store.seedFirewallWafs([{ wafId: 'waf-1' }])
    store.seedFirewallNetworkLists([{ networkListId: 30 }])

    store.setCollVer('waf', 0, 'waf-v2')
    store.setCollVer('network_list', 0, 'nl-v5')

    expect(store.appManagedVersionsChosen).toBe(true)
    expect(store.pendingDependencySelections).toEqual([])
  })
})

describe('composePayload — scoped firewall carries dependencyOverrides', () => {
  it('emits override.resource_type=firewall plus resolved function/waf/network_list dependency overrides', () => {
    const store = useReleaseStore()
    store.openRelease({
      fromVersion: true,
      scopedType: 'firewall',
      resourceId: 'fw-1',
      versionId: 'fw-promoted'
    })

    store.seedFirewallFunctions([{ functionId: 'fn-1' }])
    store.seedFirewallWafs([{ wafId: 'waf-1' }])
    store.seedFirewallNetworkLists([{ networkListId: 30 }])

    store.setCollVer('function', 0, 'fn-v3')
    store.setCollVer('waf', 0, 'waf-v2')
    store.setCollVer('network_list', 0, 'nl-v5')

    const payload = store.composePayload()

    expect(payload.scoped).toBe(true)
    expect(payload.override).toEqual({
      resource_type: 'firewall',
      resource_id: 'fw-1',
      version: 'fw-promoted'
    })
    expect(payload.dependencyOverrides).toEqual(
      expect.arrayContaining([
        { resource_id: 'fn-1', resource_type: 'function', version: 'fn-v3' },
        { resource_id: 'waf-1', resource_type: 'waf', version: 'waf-v2' },
        { resource_id: 30, resource_type: 'network_list', version: 'nl-v5' }
      ])
    )
    expect(payload.dependencyOverrides).toHaveLength(3)
  })
})
