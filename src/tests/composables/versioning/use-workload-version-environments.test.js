import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useWorkloadVersionEnvironments } from '@/composables/versioning/use-workload-version-environments'

const flush = async () => {
  await nextTick()
  for (let index = 0; index < 6; index += 1) {
    await Promise.resolve()
  }
  await nextTick()
}

describe('useWorkloadVersionEnvironments', () => {
  it('groups ready versions by environment, picking the highest version number as current', async () => {
    const versions = ref([
      { id: 'V1', state: 'ready', version: 1 },
      { id: 'V2', state: 'ready', version: 2 },
      { id: 'V3', state: 'draft', version: 3 }
    ])

    const details = {
      V1: { id: 'V1', version: 1, state: 'ready', environmentId: 'PROD', deploymentId: 'D1' },
      V2: { id: 'V2', version: 2, state: 'ready', environmentId: 'PROD', deploymentId: 'D2' }
    }
    const service = {
      loadVersion: vi.fn((resourceId, versionId) => Promise.resolve(details[versionId]))
    }

    const { environments } = useWorkloadVersionEnvironments('wl-1', versions, { service })
    await flush()

    expect(environments.value).toHaveLength(1)
    expect(environments.value[0]).toMatchObject({
      environmentId: 'PROD',
      deploymentId: 'D2',
      version: { id: 'V2', version: 2 }
    })
    expect(service.loadVersion).not.toHaveBeenCalledWith('wl-1', 'V3')
  })

  it('skips versions whose detail fails to load (graceful degradation)', async () => {
    const versions = ref([
      { id: 'OK', state: 'ready', version: 1 },
      { id: 'BAD', state: 'ready', version: 2 }
    ])
    const service = {
      loadVersion: vi.fn((resourceId, versionId) =>
        versionId === 'BAD'
          ? Promise.reject(new Error('404'))
          : Promise.resolve({ id: 'OK', version: 1, environmentId: 'STG' })
      )
    }

    const { environments } = useWorkloadVersionEnvironments('wl-1', versions, { service })
    await flush()

    expect(environments.value).toHaveLength(1)
    expect(environments.value[0].environmentId).toBe('STG')
  })

  it('skips versions without an environment binding', async () => {
    const versions = ref([{ id: 'V1', state: 'ready', version: 1 }])
    const service = {
      loadVersion: vi.fn(() => Promise.resolve({ id: 'V1', version: 1, environmentId: null }))
    }

    const { environments } = useWorkloadVersionEnvironments('wl-1', versions, { service })
    await flush()

    expect(environments.value).toEqual([])
  })

  it('is empty when there are no ready versions', async () => {
    const versions = ref([{ id: 'D', state: 'draft', version: 1 }])
    const service = { loadVersion: vi.fn() }

    const { environments } = useWorkloadVersionEnvironments('wl-1', versions, { service })
    await flush()

    expect(environments.value).toEqual([])
    expect(service.loadVersion).not.toHaveBeenCalled()
  })
})
