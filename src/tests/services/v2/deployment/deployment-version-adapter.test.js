import { describe, it, expect } from 'vitest'
import { DeploymentVersionAdapter } from '@/services/v2/deployment/deployment-version-adapter'

// A deployment version row as returned by the API: version meta + a resources[]
// snapshot (each resource carries its own pinned resource_version_id).
const deploymentVersion = (overrides = {}) => ({
  id: 'AVDEP0001',
  deployment_id: 'ADEP0001',
  name: 'release-42',
  state: 'ready',
  state_detail: null,
  description: 'ship it',
  updated_at: '2026-06-18T10:05:00Z',
  created_at: '2026-06-18T10:00:00Z',
  last_modified_by: { email: 'editor@azion.com' },
  created_by: 'creator@azion.com',
  resources: [
    {
      resource_id: 900,
      resource_type: 'application',
      resource_name: 'my-app',
      resource_version_id: 'AVAPP0007'
    },
    {
      resource_id: 901,
      resource_type: 'firewall',
      resource_name: 'my-fw',
      resource_version_id: 'AVFW0007'
    }
  ],
  ...overrides
})

describe('DeploymentVersionAdapter.transformLoadVersion', () => {
  it('normalizes meta, resources and derives status from state', () => {
    const result = DeploymentVersionAdapter.transformLoadVersion(deploymentVersion())

    expect(result.id).toBe('AVDEP0001')
    expect(result.deployment_id).toBe('ADEP0001')
    expect(result.name).toBe('release-42')
    expect(result.state).toBe('ready')
    expect(result.comment).toBe('ship it')
    expect(result.status).toEqual({ content: 'Ready', severity: 'success' })
    // last_modified_by wins over created_by for the editor column.
    expect(result.lastEditor).toBe('editor@azion.com')
    expect(result.lastModified).toBeTruthy()
  })

  it('maps each snapshot resource to its label/icon + pinned version id', () => {
    const { resources } = DeploymentVersionAdapter.transformLoadVersion(deploymentVersion())

    expect(resources).toHaveLength(2)
    expect(resources[0]).toEqual({
      id: 900,
      type: 'application',
      label: 'Application',
      icon: 'ai ai-edge-application',
      name: 'my-app',
      versionId: 'AVAPP0007'
    })
    expect(resources[1]).toMatchObject({
      type: 'firewall',
      label: 'Firewall',
      versionId: 'AVFW0007'
    })
  })

  it('reads state from the nested meta envelope and reads description from meta', () => {
    const result = DeploymentVersionAdapter.transformLoadVersion({
      id: 'AVDEP0002',
      meta: { version_state: 'building', description: 'from meta' }
    })

    expect(result.state).toBe('building')
    expect(result.status).toEqual({ content: 'Building', severity: 'info' })
    expect(result.comment).toBe('from meta')
  })

  it('falls back to created_by when last_modified_by is absent, and to Unknown status', () => {
    const result = DeploymentVersionAdapter.transformLoadVersion({
      id: 'AVDEP0003',
      created_by: 'creator@azion.com'
    })

    expect(result.lastEditor).toBe('creator@azion.com')
    expect(result.state).toBeNull()
    expect(result.status).toEqual({ content: 'Unknown', severity: 'secondary' })
    expect(result.resources).toEqual([])
  })

  it('returns null for a nullish payload', () => {
    expect(DeploymentVersionAdapter.transformLoadVersion(null)).toBeNull()
    expect(DeploymentVersionAdapter.transformLoadVersion(undefined)).toBeNull()
  })
})

describe('DeploymentVersionAdapter.transformListVersions', () => {
  it('maps an array of versions with status per item', () => {
    const result = DeploymentVersionAdapter.transformListVersions([
      deploymentVersion(),
      deploymentVersion({ id: 'AVDEP0002', state: 'draft', resources: [] })
    ])

    expect(result).toHaveLength(2)
    expect(result[0].status).toEqual({ content: 'Ready', severity: 'success' })
    expect(result[1].status).toEqual({ content: 'Draft', severity: 'info' })
  })

  it('returns [] for a non-array payload', () => {
    expect(DeploymentVersionAdapter.transformListVersions(null)).toEqual([])
    expect(DeploymentVersionAdapter.transformListVersions({ results: [] })).toEqual([])
  })

  it('exposes the pre-contract aliases used by the service', () => {
    expect(DeploymentVersionAdapter.transformList).toBe(
      DeploymentVersionAdapter.transformListVersions
    )
    expect(DeploymentVersionAdapter.transformItem).toBe(
      DeploymentVersionAdapter.transformLoadVersion
    )
  })
})

describe('DeploymentVersionAdapter payload transforms', () => {
  it('transformCreateDraftPayload keeps only resource {id, resource_type} + strategy/origin', () => {
    const payload = DeploymentVersionAdapter.transformCreateDraftPayload({
      strategy: 'canary',
      origin: 'console',
      resources: [
        { id: 900, resource_type: 'application', extra: 'dropped' },
        { id: 901, resource_type: 'firewall' }
      ]
    })

    expect(payload).toEqual({
      strategy: 'canary',
      origin: 'console',
      resources: [
        { id: 900, resource_type: 'application' },
        { id: 901, resource_type: 'firewall' }
      ]
    })
  })

  it('transformDraftPayload omits absent keys (undefined resources → key absent)', () => {
    const payload = DeploymentVersionAdapter.transformDraftPayload({ strategy: 'atomic' })
    expect(payload).toEqual({ strategy: 'atomic' })
    expect(payload).not.toHaveProperty('resources')
    expect(payload).not.toHaveProperty('origin')
  })

  it('transformBuildPayload / transformArchivePayload carry only reason + comment', () => {
    expect(
      DeploymentVersionAdapter.transformBuildPayload({ reason: 'go-live', comment: 'note' })
    ).toEqual({ reason: 'go-live', comment: 'note' })
    expect(DeploymentVersionAdapter.transformArchivePayload({ comment: 'bye' })).toEqual({
      comment: 'bye'
    })
    expect(DeploymentVersionAdapter.transformBuildPayload({})).toEqual({})
  })

  it('exposes the pre-contract payload aliases used by the service', () => {
    expect(DeploymentVersionAdapter.transformCreatePayload).toBe(
      DeploymentVersionAdapter.transformCreateDraftPayload
    )
    expect(DeploymentVersionAdapter.transformCancelPayload).toBe(
      DeploymentVersionAdapter.transformBuildPayload
    )
  })
})
