import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/v2/workload/workload-service', () => ({
  workloadService: { loadWorkloadBindings: vi.fn() }
}))
vi.mock('@/services/v2/environment/environment-service', () => ({
  environmentService: { loadEnvironmentService: vi.fn() }
}))
vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: { getDeploymentByIdService: vi.fn() }
}))
vi.mock('@/services/v2/deployment/deployment-release-service', () => ({
  deploymentReleaseService: { getActiveReleaseComposition: vi.fn() }
}))
vi.mock('@/services/v2/edge-app/edge-app-service', () => ({
  edgeAppService: { loadEdgeApplicationService: vi.fn() }
}))

import { workloadService } from '@/services/v2/workload/workload-service'
import { environmentService } from '@/services/v2/environment/environment-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { deployDrawerService } from '@/services/v2/deploy-drawer/deploy-drawer-service'

const BINDING = { environment_id: 'AENV1', deployment_id: 'ADEP1', domains: ['x.azion.app'] }

beforeEach(() => {
  workloadService.loadWorkloadBindings.mockResolvedValue([BINDING])
  environmentService.loadEnvironmentService.mockResolvedValue({
    id: 'AENV1',
    name: 'Production',
    deployment_policy: 'single_version'
  })
  deploymentService.getDeploymentByIdService.mockResolvedValue({
    data: { id: 'ADEP1', name: 'Prod Strategy' }
  })
  deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(null)
  edgeAppService.loadEdgeApplicationService.mockResolvedValue({ name: 'My App' })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('deployDrawerService.loadWorkloadEnvironments', () => {
  it('resolves environment + deployment NAMES by id (binding carries only ids)', async () => {
    const [card] = await deployDrawerService.loadWorkloadEnvironments('wl-1', {
      resourceType: 'application'
    })

    expect(environmentService.loadEnvironmentService).toHaveBeenCalledWith({ id: 'AENV1' })
    expect(deploymentService.getDeploymentByIdService).toHaveBeenCalledWith('ADEP1')
    expect(card).toMatchObject({
      id: 'AENV1',
      name: 'Production',
      policyLabel: 'Single Version',
      deploymentId: 'ADEP1',
      deploymentName: 'Prod Strategy',
      domains: ['x.azion.app']
    })
  })

  it('enrichReleases adds the active release (name, consumes, workloadCount) to a card', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      name: 'release-42',
      workload_count: 20,
      resources: [{ resource_type: 'application', resource_id: 42 }]
    })

    const base = await deployDrawerService.loadWorkloadEnvironments('wl-1')
    const [card] = await deployDrawerService.enrichReleases(base, 'application')

    expect(card.activeReleaseName).toBe('release-42')
    expect(card.workloadCount).toBe(20)
    expect(card.consumes).toBe(true)
  })

  it('enrichReleases resolves the consumed resource id of the active release to a NAME', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      name: 'release-42',
      resources: [{ resource_type: 'application', resource_id: 42 }]
    })
    edgeAppService.loadEdgeApplicationService.mockResolvedValue({ name: 'Other App' })

    const base = await deployDrawerService.loadWorkloadEnvironments('wl-1')
    const [card] = await deployDrawerService.enrichReleases(base, 'application')

    expect(edgeAppService.loadEdgeApplicationService).toHaveBeenCalledWith({ id: 42 })
    expect(card.consumedResourceId).toBe(42)
    expect(card.consumedResourceName).toBe('Other App')
  })

  it('enrichReleases reads the application id from global_id and resolves its NAME', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      name: 'release-42',
      resources: [{ resource_type: 'application', global_id: 99 }]
    })
    edgeAppService.loadEdgeApplicationService.mockResolvedValue({ name: 'Global App' })

    const base = await deployDrawerService.loadWorkloadEnvironments('wl-1')
    const [card] = await deployDrawerService.enrichReleases(base, 'application')

    expect(edgeAppService.loadEdgeApplicationService).toHaveBeenCalledWith({ id: 99 })
    expect(card.consumedResourceId).toBe(99)
    expect(card.consumedResourceName).toBe('Global App')
  })

  it('enrichReleases prefers an inline resource name when the release carries one', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      name: 'release-42',
      resources: [{ resource_type: 'application', global_id: 99, resource_name: 'Inline App' }]
    })

    const base = await deployDrawerService.loadWorkloadEnvironments('wl-1')
    const [card] = await deployDrawerService.enrichReleases(base, 'application')

    expect(card.consumedResourceName).toBe('Inline App')
    expect(edgeAppService.loadEdgeApplicationService).not.toHaveBeenCalled()
  })

  it('enrichReleases degrades the consumed resource NAME to its id when resolution fails', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      name: 'release-42',
      resources: [{ resource_type: 'application', resource_id: 42 }]
    })
    edgeAppService.loadEdgeApplicationService.mockRejectedValue(new Error('boom'))

    const base = await deployDrawerService.loadWorkloadEnvironments('wl-1')
    const [card] = await deployDrawerService.enrichReleases(base, 'application')

    expect(card.consumedResourceName).toBe('42')
  })

  it('enrichReleases marks consumes false when the release lacks the context resource type', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      name: 'release-7',
      resources: [{ resource_type: 'firewall', resource_id: 7 }]
    })

    const base = await deployDrawerService.loadWorkloadEnvironments('wl-1')
    const [card] = await deployDrawerService.enrichReleases(base, 'application')

    expect(card.consumes).toBe(false)
    expect(card.consumedResourceName).toBe(null)
  })

  it('degrades to the binding ids when env/deployment resolution fails (never blocks)', async () => {
    environmentService.loadEnvironmentService.mockRejectedValue(new Error('boom'))
    deploymentService.getDeploymentByIdService.mockRejectedValue(new Error('boom'))

    const [card] = await deployDrawerService.loadWorkloadEnvironments('wl-1')

    expect(card.name).toBe('AENV1')
    expect(card.deploymentName).toBe('ADEP1')
  })

  it('returns [] for a workload without bindings', async () => {
    workloadService.loadWorkloadBindings.mockResolvedValue([])
    expect(await deployDrawerService.loadWorkloadEnvironments('wl-1')).toEqual([])
  })

  it('returns [] and skips I/O when no workloadId is given', async () => {
    expect(await deployDrawerService.loadWorkloadEnvironments(null)).toEqual([])
    expect(workloadService.loadWorkloadBindings).not.toHaveBeenCalled()
  })
})
