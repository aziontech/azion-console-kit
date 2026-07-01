import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/services/v2/edge-firewall/edge-firewall-version-service', () => ({
  edgeFirewallVersionService: {
    loadVersion: vi.fn()
  }
}))

import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'
import { useFirewallVersionReady } from '@/templates/release-composition/use-firewall-version-ready'

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
  edgeFirewallVersionService.loadVersion.mockReset()
})

describe('useFirewallVersionReady - gated off', () => {
  it('should not call loadVersion and stay not ready when versionId is null', async () => {
    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-1'), versionId: ref(null), enabled: true })
    )
    await flushPromises()

    expect(edgeFirewallVersionService.loadVersion).not.toHaveBeenCalled()
    expect(exposed.isReady.value).toBe(false)

    dispose()
  })

  it('should not call loadVersion when enabled is false', async () => {
    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-1'), versionId: ref('v-1'), enabled: false })
    )
    await flushPromises()

    expect(edgeFirewallVersionService.loadVersion).not.toHaveBeenCalled()
    expect(exposed.isReady.value).toBe(false)

    dispose()
  })
})

describe('useFirewallVersionReady - ready state', () => {
  it('should set isReady true and toggle isLoading when the version state is ready', async () => {
    edgeFirewallVersionService.loadVersion.mockResolvedValue({ state: 'ready' })

    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-2'), versionId: ref('v-2'), enabled: true })
    )

    expect(exposed.isLoading.value).toBe(true)
    await flushPromises()

    expect(edgeFirewallVersionService.loadVersion).toHaveBeenCalledWith('fw-2', 'v-2')
    expect(exposed.isReady.value).toBe(true)
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })

  it('should set isReady true using the version_state fallback key', async () => {
    edgeFirewallVersionService.loadVersion.mockResolvedValue({ version_state: 'ready' })

    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-3'), versionId: ref('v-3'), enabled: true })
    )
    await flushPromises()

    expect(exposed.isReady.value).toBe(true)

    dispose()
  })
})

describe('useFirewallVersionReady - non-ready states', () => {
  it.each(['draft', 'building', 'active'])(
    'should keep isReady false when the version state is %s',
    async (state) => {
      edgeFirewallVersionService.loadVersion.mockResolvedValue({ state })

      const { exposed, dispose } = runInScope(() =>
        useFirewallVersionReady({ firewallId: ref('fw-4'), versionId: ref('v-4'), enabled: true })
      )
      await flushPromises()

      expect(exposed.isReady.value).toBe(false)
      expect(exposed.hasError.value).toBe(false)

      dispose()
    }
  )
})

describe('useFirewallVersionReady - error degradation', () => {
  it('should degrade to not ready with hasError when loadVersion rejects', async () => {
    edgeFirewallVersionService.loadVersion.mockRejectedValue(new Error('load boom'))

    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-5'), versionId: ref('v-5'), enabled: true })
    )
    await flushPromises()

    expect(exposed.isReady.value).toBe(false)
    expect(exposed.hasError.value).toBe(true)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })
})

describe('useFirewallVersionReady - retry', () => {
  it('should re-run loadVersion for the current keys when retry is invoked after a failure', async () => {
    edgeFirewallVersionService.loadVersion
      .mockRejectedValueOnce(new Error('transient boom'))
      .mockResolvedValueOnce({ state: 'ready' })

    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-8'), versionId: ref('v-8'), enabled: true })
    )
    await flushPromises()

    expect(exposed.hasError.value).toBe(true)
    expect(exposed.isReady.value).toBe(false)

    await exposed.retry()
    await flushPromises()

    expect(edgeFirewallVersionService.loadVersion).toHaveBeenLastCalledWith('fw-8', 'v-8')
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isReady.value).toBe(true)

    dispose()
  })

  it('should re-run loadVersion when versionId changes', async () => {
    edgeFirewallVersionService.loadVersion.mockImplementation((_fwId, verId) =>
      Promise.resolve(verId === 'v-7' ? { state: 'ready' } : { state: 'draft' })
    )

    const versionId = ref('v-6')
    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-6'), versionId, enabled: true })
    )
    await flushPromises()

    expect(exposed.isReady.value).toBe(false)

    versionId.value = 'v-7'
    await nextTick()
    await flushPromises()

    expect(edgeFirewallVersionService.loadVersion).toHaveBeenLastCalledWith('fw-6', 'v-7')
    expect(exposed.isReady.value).toBe(true)

    dispose()
  })
})
