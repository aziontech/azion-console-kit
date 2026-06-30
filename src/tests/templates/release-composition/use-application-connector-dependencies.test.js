import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/services/v2/edge-app/edge-app-rules-engine-service', () => ({
  rulesEngineService: {
    listConnectorDependenciesByVersion: vi.fn()
  }
}))

import { rulesEngineService } from '@/services/v2/edge-app/edge-app-rules-engine-service'
import { useApplicationConnectorDependencies } from '@/templates/release-composition/use-application-connector-dependencies'

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
  rulesEngineService.listConnectorDependenciesByVersion.mockReset()
})

describe('useApplicationConnectorDependencies - gating', () => {
  it('should not call the service and stay empty when versionId is null', async () => {
    const { exposed, dispose } = runInScope(() =>
      useApplicationConnectorDependencies({
        applicationId: ref('app-1'),
        versionId: ref(null),
        enabled: true
      })
    )
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).not.toHaveBeenCalled()
    expect(exposed.connectorDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })

  it('should not call the service and stay empty when enabled is false', async () => {
    const { exposed, dispose } = runInScope(() =>
      useApplicationConnectorDependencies({
        applicationId: ref('app-1'),
        versionId: ref('v-1'),
        enabled: false
      })
    )
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).not.toHaveBeenCalled()
    expect(exposed.connectorDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })
})

describe('useApplicationConnectorDependencies - resolved list', () => {
  it('should call the service with applicationId and versionId and expose the deduped dependency list', async () => {
    rulesEngineService.listConnectorDependenciesByVersion.mockResolvedValue([
      { connectorId: 10, ruleCount: 1 },
      { connectorId: 10, ruleCount: 1 },
      { connectorId: 20, ruleCount: 1 }
    ])

    const { exposed, dispose } = runInScope(() =>
      useApplicationConnectorDependencies({
        applicationId: ref('app-1'),
        versionId: ref('v-1'),
        enabled: true
      })
    )

    expect(exposed.isLoading.value).toBe(true)
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledWith(
      'app-1',
      'v-1'
    )
    expect(exposed.connectorDependencies.value).toEqual([
      { connectorId: 10, ruleCount: 2 },
      { connectorId: 20, ruleCount: 1 }
    ])
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })

  it('should keep dependencies empty without error when the service returns an empty list', async () => {
    rulesEngineService.listConnectorDependenciesByVersion.mockResolvedValue([])

    const { exposed, dispose } = runInScope(() =>
      useApplicationConnectorDependencies({
        applicationId: ref('app-2'),
        versionId: ref('v-2'),
        enabled: true
      })
    )
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledWith(
      'app-2',
      'v-2'
    )
    expect(exposed.connectorDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })
})

describe('useApplicationConnectorDependencies - error degradation', () => {
  it('should degrade to an empty list with hasError without throwing when the service rejects', async () => {
    rulesEngineService.listConnectorDependenciesByVersion.mockRejectedValue(new Error('list boom'))

    const { exposed, dispose } = runInScope(() =>
      useApplicationConnectorDependencies({
        applicationId: ref('app-3'),
        versionId: ref('v-3'),
        enabled: true
      })
    )
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledWith(
      'app-3',
      'v-3'
    )
    expect(exposed.connectorDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(true)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })
})

describe('useApplicationConnectorDependencies - reactive versionId', () => {
  it('should re-run the load with the new version when versionId changes', async () => {
    rulesEngineService.listConnectorDependenciesByVersion.mockImplementation((_appId, verId) =>
      Promise.resolve(
        verId === 'v-5' ? [{ connectorId: 99, ruleCount: 1 }] : [{ connectorId: 10, ruleCount: 1 }]
      )
    )

    const versionId = ref('v-4')
    const { exposed, dispose } = runInScope(() =>
      useApplicationConnectorDependencies({
        applicationId: ref('app-4'),
        versionId,
        enabled: true
      })
    )
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledWith(
      'app-4',
      'v-4'
    )
    expect(exposed.connectorDependencies.value).toEqual([{ connectorId: 10, ruleCount: 1 }])

    versionId.value = 'v-5'
    await nextTick()
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledWith(
      'app-4',
      'v-5'
    )
    expect(exposed.connectorDependencies.value).toEqual([{ connectorId: 99, ruleCount: 1 }])

    dispose()
  })
})

describe('useApplicationConnectorDependencies - reactive applicationId', () => {
  it('should re-run the load with the new id when applicationId changes', async () => {
    rulesEngineService.listConnectorDependenciesByVersion.mockImplementation((appId) =>
      Promise.resolve(
        appId === 'app-6'
          ? [{ connectorId: 99, ruleCount: 1 }]
          : [{ connectorId: 10, ruleCount: 1 }]
      )
    )

    const applicationId = ref('app-5')
    const { exposed, dispose } = runInScope(() =>
      useApplicationConnectorDependencies({
        applicationId,
        versionId: ref('v-1'),
        enabled: true
      })
    )
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledWith(
      'app-5',
      'v-1'
    )
    expect(exposed.connectorDependencies.value).toEqual([{ connectorId: 10, ruleCount: 1 }])

    applicationId.value = 'app-6'
    await nextTick()
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledWith(
      'app-6',
      'v-1'
    )
    expect(exposed.connectorDependencies.value).toEqual([{ connectorId: 99, ruleCount: 1 }])

    dispose()
  })
})

describe('useApplicationConnectorDependencies - retry', () => {
  it('should re-run the load for the current id and version when retry is invoked after a failure', async () => {
    rulesEngineService.listConnectorDependenciesByVersion
      .mockRejectedValueOnce(new Error('transient boom'))
      .mockResolvedValueOnce([{ connectorId: 42, ruleCount: 3 }])

    const { exposed, dispose } = runInScope(() =>
      useApplicationConnectorDependencies({
        applicationId: ref('app-7'),
        versionId: ref('v-7'),
        enabled: true
      })
    )
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledTimes(1)
    expect(exposed.hasError.value).toBe(true)
    expect(exposed.connectorDependencies.value).toEqual([])

    await exposed.retry()
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledTimes(2)
    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenLastCalledWith(
      'app-7',
      'v-7'
    )
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.connectorDependencies.value).toEqual([{ connectorId: 42, ruleCount: 3 }])

    dispose()
  })
})
