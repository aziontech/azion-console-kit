import { describe, expect, it } from 'vitest'
import { DeploymentAdapter } from '@/services/v2/deployment/deployment-adapter'

const activeRelease = {
  resources: [
    {
      resource_type: 'application',
      resource_id: 42,
      resource_version_id: 'app-version-live',
      resource_name: 'my-app'
    },
    {
      resource_type: 'firewall',
      resource_id: 7,
      resource_version_id: 'fw-version-live',
      resource_name: 'my-fw'
    },
    {
      resource_type: 'function',
      resource_id: 9,
      resource_version_id: null,
      resource_name: 'my-fn'
    }
  ]
}

describe('DeploymentAdapter.transformReleaseComposition', () => {
  it('extracts applicationFromRelease with resourceName when an application resource is present', () => {
    const result = DeploymentAdapter.transformReleaseComposition(activeRelease, {
      resourceType: 'firewall'
    })

    expect(result.applicationFromRelease).toEqual({
      resourceId: 42,
      resourceName: 'my-app',
      resourceVersion: 'app-version-live'
    })
  })

  it('reads the live API shape: version_id + global_id (resource_id null) for the application', () => {
    const apiRelease = {
      resources: [
        {
          global_id: 1781782755,
          resource_id: null,
          resource_type: 'application',
          version_id: 'AR252CEW'
        }
      ]
    }

    const result = DeploymentAdapter.transformReleaseComposition(apiRelease, {
      resourceType: 'firewall'
    })

    expect(result.applicationFromRelease).toEqual({
      resourceId: 1781782755,
      resourceName: null,
      resourceVersion: 'AR252CEW'
    })
  })

  it('returns applicationFromRelease as null when the release has no application resource', () => {
    const releaseWithoutApp = {
      resources: [activeRelease.resources[1], activeRelease.resources[2]]
    }

    const result = DeploymentAdapter.transformReleaseComposition(releaseWithoutApp, {
      resourceType: 'firewall'
    })

    expect(result.applicationFromRelease).toBeNull()
  })

  it('excludes both application and the scoped type from readOnlyResources', () => {
    const result = DeploymentAdapter.transformReleaseComposition(activeRelease, {
      resourceType: 'firewall'
    })

    expect(result.readOnlyResources).toEqual([
      {
        resourceType: 'function',
        resourceId: 9,
        resourceName: 'my-fn',
        resourceVersion: null
      }
    ])
  })

  it('excludes application from readOnlyResources when the scoped type is application', () => {
    const result = DeploymentAdapter.transformReleaseComposition(activeRelease, {
      resourceType: 'application'
    })

    expect(result.applicationFromRelease).toEqual({
      resourceId: 42,
      resourceName: 'my-app',
      resourceVersion: 'app-version-live'
    })
    expect(result.readOnlyResources.some((entry) => entry.resourceType === 'application')).toBe(
      false
    )
    expect(result.readOnlyResources).toEqual([
      {
        resourceType: 'firewall',
        resourceId: 7,
        resourceName: 'my-fw',
        resourceVersion: 'fw-version-live'
      },
      { resourceType: 'function', resourceId: 9, resourceName: 'my-fn', resourceVersion: null }
    ])
  })

  it('returns the empty baseline when the release is null', () => {
    expect(
      DeploymentAdapter.transformReleaseComposition(null, { resourceType: 'firewall' })
    ).toEqual({ applicationFromRelease: null, readOnlyResources: [] })
  })

  it('matches the scoped type exclusion by string regardless of id type', () => {
    const release = {
      resources: [
        {
          resource_type: 'application',
          resource_id: '42',
          resource_version_id: 'app-v',
          resource_name: 'my-app'
        },
        {
          resource_type: 'firewall',
          resource_id: '7',
          resource_version_id: 'fw-v',
          resource_name: 'my-fw'
        }
      ]
    }

    const result = DeploymentAdapter.transformReleaseComposition(release, {
      resourceType: 'firewall'
    })

    expect(result.applicationFromRelease.resourceId).toBe('42')
    expect(result.readOnlyResources).toEqual([])
  })
})

describe('DeploymentAdapter.transformBuildAndActivatePayload', () => {
  const singleResource = [
    {
      resource_id: 42,
      resource_version: 'app-version-id',
      resource_type: 'application',
      name: 'my-app'
    }
  ]

  // P1 — application is keyed by global_id + version_id (schema shape), no name.
  it('emits the application resource by global_id + version_id (no strategy)', () => {
    const payload = DeploymentAdapter.transformBuildAndActivatePayload(singleResource)

    expect(payload).toEqual({
      resources: [
        {
          global_id: 42,
          version_id: 'app-version-id',
          resource_type: 'application'
        }
      ]
    })
    expect(payload.resources[0]).not.toHaveProperty('resource_id')
    expect(payload.resources[0]).not.toHaveProperty('name')
    expect(payload).not.toHaveProperty('strategy')
  })

  it('maps version to version_id and omits undefined keys via pickDefined', () => {
    const payload = DeploymentAdapter.transformBuildAndActivatePayload([
      { resource_id: 1, resource_version: 'v1' }
    ])

    expect(payload.resources[0]).toEqual({ resource_id: 1, version_id: 'v1' })
    expect(payload.resources[0]).not.toHaveProperty('global_id')
    expect(payload.resources[0]).not.toHaveProperty('resource_type')
    expect(payload.resources[0]).not.toHaveProperty('name')
  })

  it('preserves order and maps multiple resources', () => {
    const payload = DeploymentAdapter.transformBuildAndActivatePayload([
      { resource_id: 1, resource_version: 'v1', resource_type: 'application' },
      { resource_id: 2, resource_version: 'v2', resource_type: 'firewall' }
    ])

    expect(payload.resources).toHaveLength(2)
    expect(payload.resources[0].resource_type).toBe('application')
    expect(payload.resources[1].resource_type).toBe('firewall')
  })

  it('returns an empty resources array when called with no arguments', () => {
    expect(DeploymentAdapter.transformBuildAndActivatePayload()).toEqual({ resources: [] })
  })

  // P2 — without canary: no `strategy` key (independent of resource count).
  it('omits the strategy key entirely when no canary strategy is provided', () => {
    const noStrategy = DeploymentAdapter.transformBuildAndActivatePayload(singleResource, undefined)
    expect(noStrategy).not.toHaveProperty('strategy')

    const multiNoStrategy = DeploymentAdapter.transformBuildAndActivatePayload([
      { resource_id: 1, resource_version: 'v1', resource_type: 'application' },
      { resource_id: 2, resource_version: 'v2', resource_type: 'firewall' }
    ])
    expect(multiNoStrategy).not.toHaveProperty('strategy')
  })

  // P2 — canary: strategy present, GRADUAL with gradual_rollout, B1 mapping applied.
  it('includes the strategy and maps gradual_rollout to candidate_from_release_id (B1)', () => {
    const strategy = {
      rollout_mode: 'GRADUAL',
      gradual_rollout: {
        enabled: true,
        candidate_percentage: 25,
        candidate_cookie_name: 'canary',
        candidate_cookie_max_age_seconds: 3600,
        candidate_from_deployment_version_id: 'legacy-version-id'
      },
      skew_protection: { enabled: false }
    }

    const payload = DeploymentAdapter.transformBuildAndActivatePayload(singleResource, strategy)

    expect(payload).toHaveProperty('strategy')
    expect(payload.strategy.rollout_mode).toBe('GRADUAL')
    expect(payload.strategy).toHaveProperty('gradual_rollout')
    // B1: legacy key dropped, candidate_from_release_id emitted as null.
    expect(payload.strategy.gradual_rollout).not.toHaveProperty(
      'candidate_from_deployment_version_id'
    )
    expect(payload.strategy.gradual_rollout).toHaveProperty('candidate_from_release_id')
    expect(payload.strategy.gradual_rollout.candidate_from_release_id).toBeNull()
    expect(payload.strategy.gradual_rollout.candidate_percentage).toBe(25)
    // The resources block is unaffected by the strategy.
    expect(payload.resources).toEqual([
      {
        global_id: 42,
        version_id: 'app-version-id',
        resource_type: 'application'
      }
    ])
  })
})
