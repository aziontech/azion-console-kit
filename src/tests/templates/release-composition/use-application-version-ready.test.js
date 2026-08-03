import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { useApplicationVersionReady } from '@/templates/release-composition/use-application-version-ready'

const runInScope = (factory) => {
  const scope = effectScope()
  const exposed = scope.run(factory)
  return { exposed, dispose: () => scope.stop() }
}

const versionUrl = (appId, verId) => `v4/workspace/applications/${appId}/versions/${verId}`

let requestSpy

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn }) => queryFn())
  requestSpy = vi.spyOn(httpService, 'request')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useApplicationVersionReady - gated off', () => {
  it('should not request and stay not ready when versionId is null', async () => {
    const { exposed, dispose } = runInScope(() =>
      useApplicationVersionReady({
        applicationId: ref('app-1'),
        versionId: ref(null),
        enabled: true
      })
    )
    await flushPromises()

    expect(requestSpy).not.toHaveBeenCalled()
    expect(exposed.isReady.value).toBe(false)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })

  it('should not request and stay not ready when applicationId is null', async () => {
    const { exposed, dispose } = runInScope(() =>
      useApplicationVersionReady({
        applicationId: ref(null),
        versionId: ref('ver-1'),
        enabled: true
      })
    )
    await flushPromises()

    expect(requestSpy).not.toHaveBeenCalled()
    expect(exposed.isReady.value).toBe(false)

    dispose()
  })

  it('should not request and stay not ready when enabled is false', async () => {
    const { exposed, dispose } = runInScope(() =>
      useApplicationVersionReady({
        applicationId: ref('app-1'),
        versionId: ref('ver-1'),
        enabled: false
      })
    )
    await flushPromises()

    expect(requestSpy).not.toHaveBeenCalled()
    expect(exposed.isReady.value).toBe(false)

    dispose()
  })
})

describe('useApplicationVersionReady - ready state', () => {
  it('should set isReady true and toggle isLoading when the version state is ready', async () => {
    requestSpy.mockResolvedValue({ data: { version_id: 'ver-2', state: 'ready' } })

    const { exposed, dispose } = runInScope(() =>
      useApplicationVersionReady({
        applicationId: ref('app-2'),
        versionId: ref('ver-2'),
        enabled: true
      })
    )

    expect(exposed.isLoading.value).toBe(true)
    await flushPromises()

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: versionUrl('app-2', 'ver-2') })
    expect(exposed.isReady.value).toBe(true)
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })

  it('should set isReady true when the version exposes the version_state key', async () => {
    requestSpy.mockResolvedValue({ data: { version_id: 'ver-3', version_state: 'ready' } })

    const { exposed, dispose } = runInScope(() =>
      useApplicationVersionReady({
        applicationId: ref('app-3'),
        versionId: ref('ver-3'),
        enabled: true
      })
    )
    await flushPromises()

    expect(exposed.isReady.value).toBe(true)
    expect(exposed.hasError.value).toBe(false)

    dispose()
  })
})

describe('useApplicationVersionReady - non-ready states', () => {
  it.each(['draft', 'building', 'active'])(
    'should keep isReady false when the version state is %s',
    async (state) => {
      requestSpy.mockResolvedValue({ data: { version_id: 'ver-4', state } })

      const { exposed, dispose } = runInScope(() =>
        useApplicationVersionReady({
          applicationId: ref('app-4'),
          versionId: ref('ver-4'),
          enabled: true
        })
      )
      await flushPromises()

      expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: versionUrl('app-4', 'ver-4') })
      expect(exposed.isReady.value).toBe(false)
      expect(exposed.hasError.value).toBe(false)

      dispose()
    }
  )
})

describe('useApplicationVersionReady - error degradation', () => {
  it('should degrade to not ready with hasError without throwing when the request rejects', async () => {
    requestSpy.mockRejectedValue(new Error('load boom'))

    const { exposed, dispose } = runInScope(() =>
      useApplicationVersionReady({
        applicationId: ref('app-5'),
        versionId: ref('ver-5'),
        enabled: true
      })
    )
    await flushPromises()

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: versionUrl('app-5', 'ver-5') })
    expect(exposed.isReady.value).toBe(false)
    expect(exposed.hasError.value).toBe(true)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })
})

describe('useApplicationVersionReady - reactive versionId', () => {
  it('should re-request with the new version when versionId changes', async () => {
    requestSpy.mockImplementation(({ url }) =>
      Promise.resolve({ data: { state: url.endsWith('ver-7') ? 'ready' : 'draft' } })
    )

    const versionId = ref('ver-6')
    const { exposed, dispose } = runInScope(() =>
      useApplicationVersionReady({ applicationId: ref('app-6'), versionId, enabled: true })
    )
    await flushPromises()

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: versionUrl('app-6', 'ver-6') })
    expect(exposed.isReady.value).toBe(false)

    versionId.value = 'ver-7'
    await nextTick()
    await flushPromises()

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: versionUrl('app-6', 'ver-7') })
    expect(exposed.isReady.value).toBe(true)

    dispose()
  })
})

describe('useApplicationVersionReady - retry', () => {
  it('should re-request for the current keys when retry is invoked after a failure', async () => {
    requestSpy
      .mockRejectedValueOnce(new Error('transient boom'))
      .mockResolvedValueOnce({ data: { version_id: 'ver-8', state: 'ready' } })

    const { exposed, dispose } = runInScope(() =>
      useApplicationVersionReady({
        applicationId: ref('app-8'),
        versionId: ref('ver-8'),
        enabled: true
      })
    )
    await flushPromises()

    expect(requestSpy).toHaveBeenCalledTimes(1)
    expect(exposed.hasError.value).toBe(true)
    expect(exposed.isReady.value).toBe(false)

    await exposed.retry()
    await flushPromises()

    expect(requestSpy).toHaveBeenCalledTimes(2)
    expect(requestSpy).toHaveBeenLastCalledWith({
      method: 'GET',
      url: versionUrl('app-8', 'ver-8')
    })
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isReady.value).toBe(true)

    dispose()
  })
})
