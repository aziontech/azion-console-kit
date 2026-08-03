import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

const listWorkloads = vi.fn()
const listEnvironmentsService = vi.fn()
const listDeploymentsService = vi.fn()

vi.mock('@/services/v2/workload/workload-service', () => ({
  workloadService: {
    listWorkloads: (...args) => listWorkloads(...args)
  }
}))

vi.mock('@/services/v2/environment/environment-service', () => ({
  environmentService: {
    listEnvironmentsService: (...args) => listEnvironmentsService(...args)
  }
}))

vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: {
    listDeploymentsService: (...args) => listDeploymentsService(...args)
  }
}))

const { useWorkloadDirectory } = await import('@/composables/versioning/use-workload-directory')

const flushLoad = async () => {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

const envsFixture = {
  body: [
    { id: 'env-prod', name: 'Production' },
    { id: 'env-staging', name: 'Staging' }
  ],
  count: 2
}

describe('useWorkloadDirectory', () => {
  beforeEach(() => {
    listWorkloads.mockReset()
    listEnvironmentsService.mockReset()
    listDeploymentsService.mockReset()
    listEnvironmentsService.mockResolvedValue(envsFixture)
    listDeploymentsService.mockResolvedValue({ body: [], count: 0 })
  })

  it('builds a deployment→meta map with updatedAt and lastModifiedBy', async () => {
    listWorkloads.mockResolvedValueOnce({ body: [], count: 0 })
    listDeploymentsService.mockReset()
    listDeploymentsService.mockResolvedValueOnce({
      body: [
        {
          id: 'ADEP0001',
          updated_at: '2026-06-10T14:32:11Z',
          created_at: '2026-06-01T09:00:00Z',
          last_editor: 'ops@example.com',
          created_by: 'admin@example.com'
        },
        {
          id: 'ADEP0002',
          updated_at: null,
          created_at: '2026-05-05T10:00:00Z',
          last_editor: null,
          created_by: 'admin@example.com'
        }
      ],
      count: 2
    })

    const { deploymentToMeta } = useWorkloadDirectory()
    await flushLoad()

    expect(deploymentToMeta.value.get('ADEP0001')).toEqual({
      updatedAt: '2026-06-10T14:32:11Z',
      lastModifiedBy: 'ops@example.com'
    })
    expect(deploymentToMeta.value.get('ADEP0002')).toEqual({
      updatedAt: '2026-05-05T10:00:00Z',
      lastModifiedBy: 'admin@example.com'
    })
  })

  it('builds both deployment→workload and deployment→environment maps', async () => {
    listWorkloads.mockResolvedValueOnce({
      body: [
        {
          id: 1,
          name: { text: 'wl-prod' },
          bindings: [
            { environment_id: 'env-prod', deployment_id: 'ADEP0001' },
            { environment_id: 'env-staging', deployment_id: 'ADEP0002' }
          ]
        },
        {
          id: 2,
          name: { text: 'wl-staging' },
          bindings: [{ environment_id: 'env-staging', deployment_id: 'ADEP0003' }]
        }
      ],
      count: 2
    })

    const { deploymentToWorkload, deploymentToEnvironment, isLoading } = useWorkloadDirectory()
    await flushLoad()

    expect(isLoading.value).toBe(false)
    expect(deploymentToWorkload.value.get('ADEP0001')).toBe('wl-prod')
    expect(deploymentToWorkload.value.get('ADEP0002')).toBe('wl-prod')
    expect(deploymentToWorkload.value.get('ADEP0003')).toBe('wl-staging')
    expect(deploymentToEnvironment.value.get('ADEP0001')).toBe('Production')
    expect(deploymentToEnvironment.value.get('ADEP0002')).toBe('Staging')
    expect(deploymentToEnvironment.value.get('ADEP0003')).toBe('Staging')
  })

  it('accepts plain string names as well as { text } shape', async () => {
    listWorkloads.mockResolvedValueOnce({
      body: [
        {
          id: 1,
          name: 'wl-legacy',
          bindings: [{ deployment_id: 'D1', environment_id: 'env-prod' }]
        },
        {
          id: 2,
          name: { text: 'wl-modern' },
          bindings: [{ deployment_id: 'D2', environment_id: 'env-staging' }]
        }
      ],
      count: 2
    })

    const { deploymentToWorkload, deploymentToEnvironment } = useWorkloadDirectory()
    await flushLoad()

    expect(deploymentToWorkload.value.get('D1')).toBe('wl-legacy')
    expect(deploymentToWorkload.value.get('D2')).toBe('wl-modern')
    expect(deploymentToEnvironment.value.get('D1')).toBe('Production')
    expect(deploymentToEnvironment.value.get('D2')).toBe('Staging')
  })

  it('leaves environment blank when the environment_id is unknown', async () => {
    listWorkloads.mockResolvedValueOnce({
      body: [
        {
          id: 1,
          name: { text: 'wl' },
          bindings: [{ deployment_id: 'D1', environment_id: 'env-orphan' }]
        }
      ],
      count: 1
    })

    const { deploymentToWorkload, deploymentToEnvironment } = useWorkloadDirectory()
    await flushLoad()

    expect(deploymentToWorkload.value.get('D1')).toBe('wl')
    expect(deploymentToEnvironment.value.has('D1')).toBe(false)
  })

  it('keeps the workload map when the environments API fails', async () => {
    listEnvironmentsService.mockReset()
    listEnvironmentsService.mockRejectedValueOnce(new Error('forbidden'))
    listWorkloads.mockResolvedValueOnce({
      body: [
        {
          id: 1,
          name: { text: 'wl' },
          bindings: [{ deployment_id: 'D1', environment_id: 'env-prod' }]
        }
      ],
      count: 1
    })

    const { deploymentToWorkload, deploymentToEnvironment, isLoading } = useWorkloadDirectory()
    await flushLoad()

    expect(isLoading.value).toBe(false)
    expect(deploymentToWorkload.value.get('D1')).toBe('wl')
    expect(deploymentToEnvironment.value.size).toBe(0)
  })

  it('falls back to empty Maps when listWorkloads rejects', async () => {
    listWorkloads.mockRejectedValueOnce(new Error('forbidden'))

    const { deploymentToWorkload, deploymentToEnvironment, isLoading } = useWorkloadDirectory()
    await flushLoad()

    expect(isLoading.value).toBe(false)
    expect(deploymentToWorkload.value.size).toBe(0)
    expect(deploymentToEnvironment.value.size).toBe(0)
  })

  it('skips bindings with missing ids or workloads with no name', async () => {
    listWorkloads.mockResolvedValueOnce({
      body: [
        {
          id: 1,
          name: { text: null },
          bindings: [{ deployment_id: 'D1', environment_id: 'env-prod' }]
        },
        {
          id: 2,
          name: { text: 'ok' },
          bindings: [
            { deployment_id: null, environment_id: 'env-prod' },
            { deployment_id: 'D2', environment_id: 'env-staging' }
          ]
        }
      ],
      count: 2
    })

    const { deploymentToWorkload, deploymentToEnvironment } = useWorkloadDirectory()
    await flushLoad()

    expect(deploymentToWorkload.value.has('D1')).toBe(false)
    expect(deploymentToWorkload.value.get('D2')).toBe('ok')
    expect(deploymentToEnvironment.value.get('D2')).toBe('Staging')
  })

  it('does not call the services when enabled=false', async () => {
    const { deploymentToWorkload, deploymentToEnvironment, isLoading } = useWorkloadDirectory({
      enabled: false
    })
    await flushLoad()

    expect(listWorkloads).not.toHaveBeenCalled()
    expect(listEnvironmentsService).not.toHaveBeenCalled()
    expect(listDeploymentsService).not.toHaveBeenCalled()
    expect(isLoading.value).toBe(false)
    expect(deploymentToWorkload.value.size).toBe(0)
    expect(deploymentToEnvironment.value.size).toBe(0)
  })
})
