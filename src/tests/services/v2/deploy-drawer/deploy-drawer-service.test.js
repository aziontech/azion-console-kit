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

import { workloadService } from '@/services/v2/workload/workload-service'
import { environmentService } from '@/services/v2/environment/environment-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
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

  it('enrichReleases marks consumes false when the release lacks the context resource type', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue({
      name: 'release-7',
      resources: [{ resource_type: 'firewall', resource_id: 7 }]
    })

    const base = await deployDrawerService.loadWorkloadEnvironments('wl-1')
    const [card] = await deployDrawerService.enrichReleases(base, 'application')

    expect(card.consumes).toBe(false)
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
