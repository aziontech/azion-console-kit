import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/services/v2/edge-firewall/edge-firewall-rules-engine-service', () => ({
  edgeFirewallRulesEngineService: {
    listWafDependenciesByVersion: vi.fn()
  }
}))

import { edgeFirewallRulesEngineService } from '@/services/v2/edge-firewall/edge-firewall-rules-engine-service'
import { useFirewallWafDependencies } from '@/templates/release-composition/use-firewall-waf-dependencies'

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
  edgeFirewallRulesEngineService.listWafDependenciesByVersion.mockReset()
})

describe('useFirewallWafDependencies - gating', () => {
  it('should not call the service and stay empty when versionId is null', async () => {
    const { exposed, dispose } = runInScope(() =>
      useFirewallWafDependencies({ firewallId: ref('fw-1'), versionId: ref(null), enabled: true })
    )
    await flushPromises()

    expect(edgeFirewallRulesEngineService.listWafDependenciesByVersion).not.toHaveBeenCalled()
    expect(exposed.wafDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(false)

    dispose()
  })

  it('should not call the service when enabled is false', async () => {
    const { exposed, dispose } = runInScope(() =>
      useFirewallWafDependencies({ firewallId: ref('fw-1'), versionId: ref('v-1'), enabled: false })
    )
    await flushPromises()

    expect(edgeFirewallRulesEngineService.listWafDependenciesByVersion).not.toHaveBeenCalled()
    expect(exposed.wafDependencies.value).toEqual([])

    dispose()
  })
})

describe('useFirewallWafDependencies - resolved list', () => {
  it('should call the service with firewallId and versionId and expose the deduped list', async () => {
    edgeFirewallRulesEngineService.listWafDependenciesByVersion.mockResolvedValue([
      { wafId: 10, ruleCount: 1 },
      { wafId: 10, ruleCount: 1 },
      { wafId: 20, ruleCount: 1 }
    ])

    const { exposed, dispose } = runInScope(() =>
      useFirewallWafDependencies({ firewallId: ref('fw-1'), versionId: ref('v-1'), enabled: true })
    )
    await flushPromises()

    expect(edgeFirewallRulesEngineService.listWafDependenciesByVersion).toHaveBeenCalledWith(
      'fw-1',
      'v-1'
    )
    expect(exposed.wafDependencies.value).toEqual([
      { wafId: 10, ruleCount: 2 },
      { wafId: 20, ruleCount: 1 }
    ])
    expect(exposed.hasError.value).toBe(false)

    dispose()
  })
})

describe('useFirewallWafDependencies - error degradation', () => {
  it('should degrade to an empty list with hasError when the service rejects', async () => {
    edgeFirewallRulesEngineService.listWafDependenciesByVersion.mockRejectedValue(
      new Error('list boom')
    )

    const { exposed, dispose } = runInScope(() =>
      useFirewallWafDependencies({ firewallId: ref('fw-3'), versionId: ref('v-3'), enabled: true })
    )
    await flushPromises()

    expect(exposed.wafDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(true)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })
})

describe('useFirewallWafDependencies - reactive versionId', () => {
  it('should re-run the load with the new version when versionId changes', async () => {
    edgeFirewallRulesEngineService.listWafDependenciesByVersion.mockImplementation((_fwId, verId) =>
      Promise.resolve(
        verId === 'v-5' ? [{ wafId: 99, ruleCount: 1 }] : [{ wafId: 10, ruleCount: 1 }]
      )
    )

    const versionId = ref('v-4')
    const { exposed, dispose } = runInScope(() =>
      useFirewallWafDependencies({ firewallId: ref('fw-4'), versionId, enabled: true })
    )
    await flushPromises()

    expect(exposed.wafDependencies.value).toEqual([{ wafId: 10, ruleCount: 1 }])

    versionId.value = 'v-5'
    await nextTick()
    await flushPromises()

    expect(edgeFirewallRulesEngineService.listWafDependenciesByVersion).toHaveBeenLastCalledWith(
      'fw-4',
      'v-5'
    )
    expect(exposed.wafDependencies.value).toEqual([{ wafId: 99, ruleCount: 1 }])

    dispose()
  })
})

describe('useFirewallWafDependencies - retry', () => {
  it('should re-run the load for the current ids when retry is invoked after a failure', async () => {
    edgeFirewallRulesEngineService.listWafDependenciesByVersion
      .mockRejectedValueOnce(new Error('transient boom'))
      .mockResolvedValueOnce([{ wafId: 42, ruleCount: 3 }])

    const { exposed, dispose } = runInScope(() =>
      useFirewallWafDependencies({ firewallId: ref('fw-7'), versionId: ref('v-7'), enabled: true })
    )
    await flushPromises()

    expect(exposed.hasError.value).toBe(true)

    await exposed.retry()
    await flushPromises()

    expect(edgeFirewallRulesEngineService.listWafDependenciesByVersion).toHaveBeenLastCalledWith(
      'fw-7',
      'v-7'
    )
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.wafDependencies.value).toEqual([{ wafId: 42, ruleCount: 3 }])

    dispose()
  })
})
