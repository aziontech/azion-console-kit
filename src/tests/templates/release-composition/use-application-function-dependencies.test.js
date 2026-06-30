import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/services/v2/edge-app/edge-application-functions-service', () => ({
  edgeApplicationFunctionService: {
    listFunctionDependenciesByVersion: vi.fn()
  }
}))

import { edgeApplicationFunctionService } from '@/services/v2/edge-app/edge-application-functions-service'
import { useApplicationFunctionDependencies } from '@/templates/release-composition/use-application-function-dependencies'

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
  edgeApplicationFunctionService.listFunctionDependenciesByVersion.mockReset()
})

describe('useApplicationFunctionDependencies - gated off', () => {
  it('should not call the service and keep dependencies empty when versionId is null', async () => {
    const { exposed, dispose } = runInScope(() =>
      useApplicationFunctionDependencies({
        applicationId: ref('app-1'),
        versionId: ref(null),
        enabled: true
      })
    )
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).not.toHaveBeenCalled()
    expect(exposed.functionDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })

  it('should not call the service when versionId is absent', async () => {
    const { exposed, dispose } = runInScope(() =>
      useApplicationFunctionDependencies({ applicationId: ref('app-1'), enabled: true })
    )
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).not.toHaveBeenCalled()
    expect(exposed.functionDependencies.value).toEqual([])

    dispose()
  })

  it('should not call the service when enabled is false even with both ids present', async () => {
    const { exposed, dispose } = runInScope(() =>
      useApplicationFunctionDependencies({
        applicationId: ref('app-1'),
        versionId: ref('v-1'),
        enabled: false
      })
    )
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).not.toHaveBeenCalled()
    expect(exposed.functionDependencies.value).toEqual([])

    dispose()
  })
})

describe('useApplicationFunctionDependencies - resolves version-scoped dependencies', () => {
  it('should expose the deduped dependency list for the given application and version', async () => {
    edgeApplicationFunctionService.listFunctionDependenciesByVersion.mockResolvedValue([
      { functionId: 5001, instanceCount: 2 },
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])

    const { exposed, dispose } = runInScope(() =>
      useApplicationFunctionDependencies({
        applicationId: ref('app-2'),
        versionId: ref('v-2'),
        enabled: true
      })
    )
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).toHaveBeenCalledWith(
      'app-2',
      'v-2'
    )
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.functionDependencies.value).toEqual([
      { functionId: 5001, instanceCount: 3 },
      { functionId: 5002, instanceCount: 1 }
    ])

    dispose()
  })

  it('should toggle isLoading while the service resolves', async () => {
    let resolveLoad
    edgeApplicationFunctionService.listFunctionDependenciesByVersion.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve
      })
    )

    const { exposed, dispose } = runInScope(() =>
      useApplicationFunctionDependencies({
        applicationId: ref('app-loading'),
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

  it('should keep dependencies empty without error when the service returns an empty list', async () => {
    edgeApplicationFunctionService.listFunctionDependenciesByVersion.mockResolvedValue([])

    const { exposed, dispose } = runInScope(() =>
      useApplicationFunctionDependencies({
        applicationId: ref('app-3'),
        versionId: ref('v-3'),
        enabled: true
      })
    )
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).toHaveBeenCalledWith(
      'app-3',
      'v-3'
    )
    expect(exposed.functionDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(false)

    dispose()
  })
})

describe('useApplicationFunctionDependencies - error degradation', () => {
  it('should degrade to an empty list with hasError when the service rejects', async () => {
    edgeApplicationFunctionService.listFunctionDependenciesByVersion.mockRejectedValue(
      new Error('list boom')
    )

    const { exposed, dispose } = runInScope(() =>
      useApplicationFunctionDependencies({
        applicationId: ref('app-5'),
        versionId: ref('v-5'),
        enabled: true
      })
    )
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).toHaveBeenCalledWith(
      'app-5',
      'v-5'
    )
    expect(exposed.functionDependencies.value).toEqual([])
    expect(exposed.hasError.value).toBe(true)
    expect(exposed.isLoading.value).toBe(false)

    dispose()
  })
})

describe('useApplicationFunctionDependencies - reactive versionId', () => {
  it('should re-run the load with the new version when versionId changes for the same application', async () => {
    edgeApplicationFunctionService.listFunctionDependenciesByVersion.mockImplementation(
      (_appId, verId) =>
        Promise.resolve(
          verId === 'v-next'
            ? [{ functionId: 9002, instanceCount: 2 }]
            : [{ functionId: 9001, instanceCount: 1 }]
        )
    )

    const versionId = ref('v-prev')
    const { exposed, dispose } = runInScope(() =>
      useApplicationFunctionDependencies({
        applicationId: ref('app-6'),
        versionId,
        enabled: true
      })
    )
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).toHaveBeenCalledWith(
      'app-6',
      'v-prev'
    )
    expect(exposed.functionDependencies.value).toEqual([{ functionId: 9001, instanceCount: 1 }])

    versionId.value = 'v-next'
    await nextTick()
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).toHaveBeenCalledWith(
      'app-6',
      'v-next'
    )
    expect(exposed.functionDependencies.value).toEqual([{ functionId: 9002, instanceCount: 2 }])

    dispose()
  })
})

describe('useApplicationFunctionDependencies - reactive applicationId', () => {
  it('should re-run the load with the new id when applicationId changes', async () => {
    edgeApplicationFunctionService.listFunctionDependenciesByVersion.mockImplementation((appId) =>
      Promise.resolve(
        appId === 'app-7'
          ? [{ functionId: 9001, instanceCount: 1 }]
          : [{ functionId: 8001, instanceCount: 1 }]
      )
    )

    const applicationId = ref('app-6')
    const { exposed, dispose } = runInScope(() =>
      useApplicationFunctionDependencies({
        applicationId,
        versionId: ref('v-1'),
        enabled: true
      })
    )
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).toHaveBeenCalledWith(
      'app-6',
      'v-1'
    )
    expect(exposed.functionDependencies.value).toEqual([{ functionId: 8001, instanceCount: 1 }])

    applicationId.value = 'app-7'
    await nextTick()
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).toHaveBeenCalledWith(
      'app-7',
      'v-1'
    )
    expect(exposed.functionDependencies.value).toEqual([{ functionId: 9001, instanceCount: 1 }])

    dispose()
  })
})

describe('useApplicationFunctionDependencies - retry', () => {
  it('should re-run the load for the current ids when retry is invoked after a failure', async () => {
    edgeApplicationFunctionService.listFunctionDependenciesByVersion
      .mockRejectedValueOnce(new Error('transient boom'))
      .mockResolvedValueOnce([{ functionId: 7001, instanceCount: 4 }])

    const { exposed, dispose } = runInScope(() =>
      useApplicationFunctionDependencies({
        applicationId: ref('app-8'),
        versionId: ref('v-8'),
        enabled: true
      })
    )
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).toHaveBeenCalledTimes(
      1
    )
    expect(exposed.hasError.value).toBe(true)
    expect(exposed.functionDependencies.value).toEqual([])

    await exposed.retry()
    await flushPromises()

    expect(edgeApplicationFunctionService.listFunctionDependenciesByVersion).toHaveBeenCalledTimes(
      2
    )
    expect(
      edgeApplicationFunctionService.listFunctionDependenciesByVersion
    ).toHaveBeenLastCalledWith('app-8', 'v-8')
    expect(exposed.hasError.value).toBe(false)
    expect(exposed.functionDependencies.value).toEqual([{ functionId: 7001, instanceCount: 4 }])

    dispose()
  })
})
