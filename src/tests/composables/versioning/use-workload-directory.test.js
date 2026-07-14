import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

const listWorkloads = vi.fn()

vi.mock('@/services/v2/workload/workload-service', () => ({
  workloadService: {
    listWorkloads: (...args) => listWorkloads(...args)
  }
}))

// Import AFTER the mock is registered so the composable resolves the mocked
// module instead of the real service.
const { useWorkloadDirectory } = await import('@/composables/versioning/use-workload-directory')

const flushLoad = async () => {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

describe('useWorkloadDirectory', () => {
  beforeEach(() => {
    listWorkloads.mockReset()
  })

  it('builds a deployment→workload map from the workloads list', async () => {
    listWorkloads.mockResolvedValueOnce({
      body: [
        {
          id: 1,
          name: { text: 'wl-prod' },
          bindings: [
            { environment_id: 10, deployment_id: 'ADEP0001' },
            { environment_id: 11, deployment_id: 'ADEP0002' }
          ]
        },
        {
          id: 2,
          name: { text: 'wl-staging' },
          bindings: [{ environment_id: 20, deployment_id: 'ADEP0003' }]
        }
      ],
      count: 2
    })

    const { deploymentToWorkload, isLoading } = useWorkloadDirectory()
    await flushLoad()

    expect(isLoading.value).toBe(false)
    expect(deploymentToWorkload.value.get('ADEP0001')).toBe('wl-prod')
    expect(deploymentToWorkload.value.get('ADEP0002')).toBe('wl-prod')
    expect(deploymentToWorkload.value.get('ADEP0003')).toBe('wl-staging')
    expect(deploymentToWorkload.value.size).toBe(3)
  })

  it('accepts plain string names as well as { text } shape', async () => {
    listWorkloads.mockResolvedValueOnce({
      body: [
        { id: 1, name: 'wl-legacy', bindings: [{ deployment_id: 'D1' }] },
        { id: 2, name: { text: 'wl-modern' }, bindings: [{ deployment_id: 'D2' }] }
      ],
      count: 2
    })

    const { deploymentToWorkload } = useWorkloadDirectory()
    await flushLoad()

    expect(deploymentToWorkload.value.get('D1')).toBe('wl-legacy')
    expect(deploymentToWorkload.value.get('D2')).toBe('wl-modern')
  })

  it('falls back to an empty Map when listWorkloads rejects', async () => {
    listWorkloads.mockRejectedValueOnce(new Error('forbidden'))

    const { deploymentToWorkload, isLoading } = useWorkloadDirectory()
    await flushLoad()

    expect(isLoading.value).toBe(false)
    expect(deploymentToWorkload.value.size).toBe(0)
  })

  it('skips deployments with missing ids or workloads with no name', async () => {
    listWorkloads.mockResolvedValueOnce({
      body: [
        { id: 1, name: { text: null }, bindings: [{ deployment_id: 'D1' }] },
        {
          id: 2,
          name: { text: 'ok' },
          bindings: [{ deployment_id: null }, { deployment_id: 'D2' }]
        }
      ],
      count: 2
    })

    const { deploymentToWorkload } = useWorkloadDirectory()
    await flushLoad()

    expect(deploymentToWorkload.value.has('D1')).toBe(false)
    expect(deploymentToWorkload.value.get('D2')).toBe('ok')
    expect(deploymentToWorkload.value.size).toBe(1)
  })

  it('does not call the service when enabled=false', async () => {
    const { deploymentToWorkload, isLoading } = useWorkloadDirectory({ enabled: false })
    await flushLoad()

    expect(listWorkloads).not.toHaveBeenCalled()
    expect(isLoading.value).toBe(false)
    expect(deploymentToWorkload.value.size).toBe(0)
  })
})
