import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import {
  useWorkloadVersionEnvironments,
  ENVIRONMENT_SOURCE_PAGE_SIZE
} from '@/composables/versioning/use-workload-version-environments'

const flush = async () => {
  await nextTick()
  for (let index = 0; index < 6; index += 1) {
    await Promise.resolve()
  }
  await nextTick()
}

const makeService = (versions, loadVersion) => ({
  listVersionsPage: vi.fn().mockResolvedValue({ body: versions, count: versions.length }),
  loadVersion
})

describe('useWorkloadVersionEnvironments', () => {
  it('groups ready versions by environment, picking the highest version number as current', async () => {
    const details = {
      V1: { id: 'V1', version: 1, state: 'ready', environmentId: 'PROD', deploymentId: 'D1' },
      V2: { id: 'V2', version: 2, state: 'ready', environmentId: 'PROD', deploymentId: 'D2' }
    }
    const service = makeService(
      [
        { id: 'V1', state: 'ready', version: 1 },
        { id: 'V2', state: 'ready', version: 2 },
        { id: 'V3', state: 'draft', version: 3 }
      ],
      vi.fn((resourceId, versionId) => Promise.resolve(details[versionId]))
    )

    const { environments } = useWorkloadVersionEnvironments('wl-1', { service })
    await flush()

    expect(environments.value).toHaveLength(1)
    expect(environments.value[0]).toMatchObject({
      environmentId: 'PROD',
      deploymentId: 'D2',
      version: { id: 'V2', version: 2 }
    })
    expect(service.loadVersion).not.toHaveBeenCalledWith('wl-1', 'V3')
  })

  it('sources versions beyond a single display page', async () => {
    const service = makeService([], vi.fn())

    useWorkloadVersionEnvironments('wl-1', { service })
    await flush()

    expect(service.listVersionsPage).toHaveBeenCalledWith('wl-1', {
      pageSize: ENVIRONMENT_SOURCE_PAGE_SIZE,
      skipCache: true
    })
  })

  it('resolves a ready version that no display page is showing', async () => {
    const versions = Array.from({ length: 25 }, (unused, index) => ({
      id: `V${index + 1}`,
      state: index === 24 ? 'ready' : 'draft',
      version: index + 1
    }))
    const service = makeService(
      versions,
      vi.fn(() =>
        Promise.resolve({ id: 'V25', version: 25, environmentId: 'PROD', deploymentId: 'D9' })
      )
    )

    const { environments } = useWorkloadVersionEnvironments('wl-1', { service })
    await flush()

    expect(service.loadVersion).toHaveBeenCalledWith('wl-1', 'V25')
    expect(environments.value[0]).toMatchObject({ environmentId: 'PROD', deploymentId: 'D9' })
  })

  it('skips versions whose detail fails to load (graceful degradation)', async () => {
    const service = makeService(
      [
        { id: 'OK', state: 'ready', version: 1 },
        { id: 'BAD', state: 'ready', version: 2 }
      ],
      vi.fn((resourceId, versionId) =>
        versionId === 'BAD'
          ? Promise.reject(new Error('404'))
          : Promise.resolve({ id: 'OK', version: 1, environmentId: 'STG' })
      )
    )

    const { environments } = useWorkloadVersionEnvironments('wl-1', { service })
    await flush()

    expect(environments.value).toHaveLength(1)
    expect(environments.value[0].environmentId).toBe('STG')
  })

  it('skips versions without an environment binding', async () => {
    const service = makeService(
      [{ id: 'V1', state: 'ready', version: 1 }],
      vi.fn(() => Promise.resolve({ id: 'V1', version: 1, environmentId: null }))
    )

    const { environments } = useWorkloadVersionEnvironments('wl-1', { service })
    await flush()

    expect(environments.value).toEqual([])
  })

  it('is empty when there are no ready versions', async () => {
    const service = makeService([{ id: 'D', state: 'draft', version: 1 }], vi.fn())

    const { environments } = useWorkloadVersionEnvironments('wl-1', { service })
    await flush()

    expect(environments.value).toEqual([])
    expect(service.loadVersion).not.toHaveBeenCalled()
  })

  it('empties the cards when the version listing fails', async () => {
    const service = {
      listVersionsPage: vi.fn().mockRejectedValue(new Error('down')),
      loadVersion: vi.fn()
    }

    const { environments, isResolving } = useWorkloadVersionEnvironments('wl-1', { service })
    await flush()

    expect(environments.value).toEqual([])
    expect(isResolving.value).toBe(false)
  })

  it('skips the request entirely without a workload id', async () => {
    const service = makeService([], vi.fn())

    useWorkloadVersionEnvironments('', { service })
    await flush()

    expect(service.listVersionsPage).not.toHaveBeenCalled()
  })

  it('re-resolves when the workload id changes', async () => {
    const service = makeService([], vi.fn())
    const workloadId = ref('wl-1')

    useWorkloadVersionEnvironments(workloadId, { service })
    await flush()
    service.listVersionsPage.mockClear()

    workloadId.value = 'wl-2'
    await flush()

    expect(service.listVersionsPage).toHaveBeenCalledWith('wl-2', {
      pageSize: ENVIRONMENT_SOURCE_PAGE_SIZE,
      skipCache: true
    })
  })
})
