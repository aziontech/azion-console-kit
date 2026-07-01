import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/services/v2/edge-firewall/edge-firewall-rules-engine-service', () => ({
  edgeFirewallRulesEngineService: {
    listNetworkListDependenciesByVersion: vi.fn()
  }
}))

import { edgeFirewallRulesEngineService } from '@/services/v2/edge-firewall/edge-firewall-rules-engine-service'
import { useFirewallNetworkListDependencies } from '@/templates/release-composition/use-firewall-network-list-dependencies'

const runInScope = (factory) => {
  const scope = effectScope()
  const exposed = scope.run(factory)
  return { exposed, dispose: () => scope.stop() }
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion.mockReset()
})

describe('useFirewallNetworkListDependencies - gating', () => {
  it('should not call the service and stay empty when versionId is null', async () => {
    const { exposed, dispose } = runInScope(() =>
      useFirewallNetworkListDependencies({
        firewallId: ref('fw-1'),
        versionId: ref(null),
        enabled: true
      })
    )
    await flushPromises()

    expect(
      edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion
    ).not.toHaveBeenCalled()
    expect(exposed.networkListDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(false)

    dispose()
  })

  it('should not call the service when enabled is false', async () => {
    const { exposed, dispose } = runInScope(() =>
      useFirewallNetworkListDependencies({
        firewallId: ref('fw-1'),
        versionId: ref('v-1'),
        enabled: false
      })
    )
    await flushPromises()

    expect(
      edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion
    ).not.toHaveBeenCalled()
    expect(exposed.networkListDependencies.value).toEqual([])

    dispose()
  })
})

describe('useFirewallNetworkListDependencies - resolved list', () => {
  it('should call the service with firewallId and versionId and expose the deduped list', async () => {
    edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion.mockResolvedValue([
      { networkListId: 30, ruleCount: 1 },
      { networkListId: 30, ruleCount: 1 },
      { networkListId: 40, ruleCount: 1 }
    ])

    const { exposed, dispose } = runInScope(() =>
      useFirewallNetworkListDependencies({
        firewallId: ref('fw-1'),
        versionId: ref('v-1'),
        enabled: true
      })
    )
    await flushPromises()

    expect(
      edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion
    ).toHaveBeenCalledWith('fw-1', 'v-1')
    expect(exposed.networkListDependencies.value).toEqual([
      { networkListId: 30, ruleCount: 2 },
      { networkListId: 40, ruleCount: 1 }
    ])
    expect(exposed.hasError.value).toBe(false)

    dispose()
  })
})

describe('useFirewallNetworkListDependencies - error degradation', () => {
  it('should degrade to an empty list with hasError when the service rejects', async () => {
    edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion.mockRejectedValue(
      new Error('list boom')
    )

    const { exposed, dispose } = runInScope(() =>
      useFirewallNetworkListDependencies({
        firewallId: ref('fw-3'),
        versionId: ref('v-3'),
        enabled: true
      })
    )
    await flushPromises()

    expect(exposed.networkListDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(true)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })
})

describe('useFirewallNetworkListDependencies - reactive versionId', () => {
  it('should re-run the load with the new version when versionId changes', async () => {
    edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion.mockImplementation(
      (_fwId, verId) =>
        Promise.resolve(
          verId === 'v-5'
            ? [{ networkListId: 99, ruleCount: 1 }]
            : [{ networkListId: 30, ruleCount: 1 }]
        )
    )

    const versionId = ref('v-4')
    const { exposed, dispose } = runInScope(() =>
      useFirewallNetworkListDependencies({ firewallId: ref('fw-4'), versionId, enabled: true })
    )
    await flushPromises()

    expect(exposed.networkListDependencies.value).toEqual([{ networkListId: 30, ruleCount: 1 }])

    versionId.value = 'v-5'
    await nextTick()
    await flushPromises()

    expect(
      edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion
    ).toHaveBeenLastCalledWith('fw-4', 'v-5')
    expect(exposed.networkListDependencies.value).toEqual([{ networkListId: 99, ruleCount: 1 }])

    dispose()
  })
})

describe('useFirewallNetworkListDependencies - retry', () => {
  it('should re-run the load for the current ids when retry is invoked after a failure', async () => {
    edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion
      .mockRejectedValueOnce(new Error('transient boom'))
      .mockResolvedValueOnce([{ networkListId: 42, ruleCount: 3 }])

    const { exposed, dispose } = runInScope(() =>
      useFirewallNetworkListDependencies({
        firewallId: ref('fw-7'),
        versionId: ref('v-7'),
        enabled: true
      })
    )
    await flushPromises()

    expect(exposed.hasError.value).toBe(true)

    await exposed.retry()
    await flushPromises()

    expect(
      edgeFirewallRulesEngineService.listNetworkListDependenciesByVersion
    ).toHaveBeenLastCalledWith('fw-7', 'v-7')
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.networkListDependencies.value).toEqual([{ networkListId: 42, ruleCount: 3 }])

    dispose()
  })
})
