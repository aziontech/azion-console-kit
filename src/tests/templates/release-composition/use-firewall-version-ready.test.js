import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { useFirewallVersionReady } from '@/templates/release-composition/use-firewall-version-ready'

/**
 * Real service under test: the composable runs the real `edgeFirewallVersionService`
 * (loadVersion → adapter normalization). Only the boundaries are stubbed — the
 * HTTP client (`httpService.request`) and the query cache (`queryClient.ensureQueryData`,
 * short-circuited to the fetch). Readiness is asserted by observing the HTTP call
 * the composable drives and the refs it exposes.
 */

const runInScope = (factory) => {
  const scope = effectScope()
  const exposed = scope.run(factory)
  return { exposed, dispose: () => scope.stop() }
}

const versionUrl = (fwId, verId) => `v4/workspace/firewalls/${fwId}/versions/${verId}`

let requestSpy

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn }) => queryFn())
  requestSpy = vi.spyOn(httpService, 'request')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useFirewallVersionReady - gated off', () => {
  it('should not request and stay not ready when versionId is null', async () => {
    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-1'), versionId: ref(null), enabled: true })
    )
    await flushPromises()

    expect(requestSpy).not.toHaveBeenCalled()
    expect(exposed.isReady.value).toBe(false)

    dispose()
  })

  it('should not request when enabled is false', async () => {
    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-1'), versionId: ref('v-1'), enabled: false })
    )
    await flushPromises()

    expect(requestSpy).not.toHaveBeenCalled()
    expect(exposed.isReady.value).toBe(false)

    dispose()
  })
})

describe('useFirewallVersionReady - ready state', () => {
  it('should set isReady true and toggle isLoading when the version state is ready', async () => {
    requestSpy.mockResolvedValue({ data: { version_id: 'v-2', state: 'ready' } })

    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-2'), versionId: ref('v-2'), enabled: true })
    )

    expect(exposed.isLoading.value).toBe(true)
    await flushPromises()

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: versionUrl('fw-2', 'v-2') })
    expect(exposed.isReady.value).toBe(true)
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })

  it('should set isReady true using the version_state key', async () => {
    requestSpy.mockResolvedValue({ data: { version_id: 'v-3', version_state: 'ready' } })

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
      requestSpy.mockResolvedValue({ data: { version_id: 'v-4', state } })

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
  it('should degrade to not ready with hasError when the request rejects', async () => {
    requestSpy.mockRejectedValue(new Error('load boom'))

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
  it('should re-request for the current keys when retry is invoked after a failure', async () => {
    requestSpy
      .mockRejectedValueOnce(new Error('transient boom'))
      .mockResolvedValueOnce({ data: { version_id: 'v-8', state: 'ready' } })

    const { exposed, dispose } = runInScope(() =>
      useFirewallVersionReady({ firewallId: ref('fw-8'), versionId: ref('v-8'), enabled: true })
    )
    await flushPromises()

    expect(exposed.hasError.value).toBe(true)
    expect(exposed.isReady.value).toBe(false)

    await exposed.retry()
    await flushPromises()

    expect(requestSpy).toHaveBeenLastCalledWith({ method: 'GET', url: versionUrl('fw-8', 'v-8') })
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isReady.value).toBe(true)

    dispose()
  })

  it('should re-request when versionId changes', async () => {
    requestSpy.mockImplementation(({ url }) =>
      Promise.resolve({ data: { state: url.endsWith('v-7') ? 'ready' : 'draft' } })
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

    expect(requestSpy).toHaveBeenLastCalledWith({ method: 'GET', url: versionUrl('fw-6', 'v-7') })
    expect(exposed.isReady.value).toBe(true)

    dispose()
  })
})
