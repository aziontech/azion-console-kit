import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/services/v2/edge-firewall/edge-firewall-function-service', () => ({
  edgeFirewallFunctionService: {
    listFunctionDependenciesByVersion: vi.fn()
  }
}))

import { edgeFirewallFunctionService } from '@/services/v2/edge-firewall/edge-firewall-function-service'
import { useFirewallFunctionDependencies } from '@/templates/release-composition/use-firewall-function-dependencies'

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
  edgeFirewallFunctionService.listFunctionDependenciesByVersion.mockReset()
})

describe('useFirewallFunctionDependencies - gated off', () => {
  it('should not call the service and stay empty when versionId is null', async () => {
    const { exposed, dispose } = runInScope(() =>
      useFirewallFunctionDependencies({
        firewallId: ref('fw-1'),
        versionId: ref(null),
        enabled: true
      })
    )
    await flushPromises()

    expect(edgeFirewallFunctionService.listFunctionDependenciesByVersion).not.toHaveBeenCalled()
    expect(exposed.functionDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })

  it('should not call the service when enabled is false even with both ids present', async () => {
    const { exposed, dispose } = runInScope(() =>
      useFirewallFunctionDependencies({
        firewallId: ref('fw-1'),
        versionId: ref('v-1'),
        enabled: false
      })
    )
    await flushPromises()

    expect(edgeFirewallFunctionService.listFunctionDependenciesByVersion).not.toHaveBeenCalled()
    expect(exposed.functionDependencies.value).toEqual([])

    dispose()
  })
})

describe('useFirewallFunctionDependencies - resolves version-scoped dependencies', () => {
  it('should call the service with firewallId and versionId and expose the deduped list', async () => {
    edgeFirewallFunctionService.listFunctionDependenciesByVersion.mockResolvedValue([
      { functionId: 5001, instanceCount: 2 },
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])

    const { exposed, dispose } = runInScope(() =>
      useFirewallFunctionDependencies({
        firewallId: ref('fw-2'),
        versionId: ref('v-2'),
        enabled: true
      })
    )
    await flushPromises()

    expect(edgeFirewallFunctionService.listFunctionDependenciesByVersion).toHaveBeenCalledWith(
      'fw-2',
      'v-2'
    )
    expect(exposed.functionDependencies.value).toEqual([
      { functionId: 5001, instanceCount: 3 },
      { functionId: 5002, instanceCount: 1 }
    ])
    expect(exposed.hasError.value).toBe(false)

    dispose()
  })

  it('should toggle isLoading while the service resolves', async () => {
    let resolveLoad
    edgeFirewallFunctionService.listFunctionDependenciesByVersion.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve
      })
    )

    const { exposed, dispose } = runInScope(() =>
      useFirewallFunctionDependencies({
        firewallId: ref('fw-loading'),
        versionId: ref('v-loading'),
        enabled: true
      })
    )
    await nextTick()

    expect(exposed.isLoading.value).toBe(true)

    resolveLoad([{ functionId: 1, instanceCount: 1 }])
    await flushPromises()

    expect(exposed.isLoading.value).toBe(false)
    expect(exposed.functionDependencies.value).toEqual([{ functionId: 1, instanceCount: 1 }])

    dispose()
  })
})

describe('useFirewallFunctionDependencies - error degradation', () => {
  it('should degrade to an empty list with hasError when the service rejects', async () => {
    edgeFirewallFunctionService.listFunctionDependenciesByVersion.mockRejectedValue(
      new Error('list boom')
    )

    const { exposed, dispose } = runInScope(() =>
      useFirewallFunctionDependencies({
        firewallId: ref('fw-5'),
        versionId: ref('v-5'),
        enabled: true
      })
    )
    await flushPromises()

    expect(exposed.functionDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(true)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })
})

describe('useFirewallFunctionDependencies - reactive ids', () => {
  it('should re-run the load when versionId changes for the same firewall', async () => {
    edgeFirewallFunctionService.listFunctionDependenciesByVersion.mockImplementation(
      (_fwId, verId) =>
        Promise.resolve(
          verId === 'v-next'
            ? [{ functionId: 9002, instanceCount: 2 }]
            : [{ functionId: 9001, instanceCount: 1 }]
        )
    )

    const versionId = ref('v-prev')
    const { exposed, dispose } = runInScope(() =>
      useFirewallFunctionDependencies({
        firewallId: ref('fw-6'),
        versionId,
        enabled: true
      })
    )
    await flushPromises()

    expect(exposed.functionDependencies.value).toEqual([{ functionId: 9001, instanceCount: 1 }])

    versionId.value = 'v-next'
    await nextTick()
    await flushPromises()

    expect(edgeFirewallFunctionService.listFunctionDependenciesByVersion).toHaveBeenLastCalledWith(
      'fw-6',
      'v-next'
    )
    expect(exposed.functionDependencies.value).toEqual([{ functionId: 9002, instanceCount: 2 }])

    dispose()
  })
})

describe('useFirewallFunctionDependencies - retry', () => {
  it('should re-run the load for the current ids when retry is invoked after a failure', async () => {
    edgeFirewallFunctionService.listFunctionDependenciesByVersion
      .mockRejectedValueOnce(new Error('transient boom'))
      .mockResolvedValueOnce([{ functionId: 7001, instanceCount: 4 }])

    const { exposed, dispose } = runInScope(() =>
      useFirewallFunctionDependencies({
        firewallId: ref('fw-8'),
        versionId: ref('v-8'),
        enabled: true
      })
    )
    await flushPromises()

    expect(exposed.hasError.value).toBe(true)

    await exposed.retry()
    await flushPromises()

    expect(edgeFirewallFunctionService.listFunctionDependenciesByVersion).toHaveBeenLastCalledWith(
      'fw-8',
      'v-8'
    )
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.functionDependencies.value).toEqual([{ functionId: 7001, instanceCount: 4 }])

    dispose()
  })
})
