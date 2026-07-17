import { describe, it, expect } from 'vitest'
import { activeVersionsForResource } from '@/composables/versioning/active-versions'

const rows = [
  {
    deployment_id: 'ADEP0001',
    name: 'prod-api',
    state: 'ready',
    deployment_policy: 'single_version',
    resources: [
      {
        resource_type: 'connector',
        resource_id: 318420,
        resource_version: 'ACNV0002',
        traffic_role: 'ACTIVE',
        release_id: 'AREL0001'
      }
    ]
  },
  {
    deployment_id: 'ADEP0002',
    name: 'staging',
    state: 'ready',
    deployment_policy: 'versioned_urls',
    resources: [
      {
        resource_type: 'connector',
        resource_id: 318420,
        resource_version: 'ACNV0002',
        traffic_role: 'CANDIDATE',
        release_id: 'AREL0002'
      },
      {
        resource_type: 'connector',
        resource_id: 999,
        resource_version: 'ACNV9999',
        traffic_role: 'ACTIVE'
      }
    ]
  }
]

describe('activeVersionsForResource', () => {
  it('groups by version and aggregates every serving deployment with its details', () => {
    const map = activeVersionsForResource(rows, { resource_type: 'connector', resource_id: 318420 })

    expect([...map.keys()]).toEqual(['ACNV0002'])
    expect(map.get('ACNV0002').deployments).toEqual([
      {
        id: 'ADEP0001',
        name: 'prod-api',
        state: 'ready',
        policy: 'single_version',
        trafficRole: 'ACTIVE',
        releaseId: 'AREL0001',
        deployedAt: null
      },
      {
        id: 'ADEP0002',
        name: 'staging',
        state: 'ready',
        policy: 'versioned_urls',
        trafficRole: 'CANDIDATE',
        releaseId: 'AREL0002',
        deployedAt: null
      }
    ])
  })

  it('ignores rows for a different resource id', () => {
    expect(
      activeVersionsForResource(rows, { resource_type: 'connector', resource_id: 111 }).size
    ).toBe(0)
  })

  it('matches application by resource_id (its global_id value)', () => {
    const appRows = [
      {
        deployment_id: 'ADEP0003',
        name: 'app-ds',
        state: 'ready',
        deployment_policy: 'single_version',
        resources: [
          {
            resource_type: 'application',
            resource_id: 521846,
            resource_version: 'AAPV0001',
            traffic_role: 'ACTIVE',
            release_id: 'AREL0003'
          }
        ]
      }
    ]

    const byResourceId = activeVersionsForResource(appRows, {
      resource_type: 'application',
      resource_id: 521846
    })
    expect(byResourceId.get('AAPV0001').deployments[0]).toEqual({
      id: 'ADEP0003',
      name: 'app-ds',
      state: 'ready',
      policy: 'single_version',
      trafficRole: 'ACTIVE',
      releaseId: 'AREL0003',
      deployedAt: null
    })

    const byOtherId = activeVersionsForResource(appRows, {
      resource_type: 'application',
      resource_id: 555
    })
    expect(byOtherId.size).toBe(0)
  })

  it('returns an empty map for empty or invalid input', () => {
    expect(activeVersionsForResource([], { resource_type: 'waf', resource_id: 1 }).size).toBe(0)
    expect(activeVersionsForResource(null, { resource_type: 'waf', resource_id: 1 }).size).toBe(0)
    expect(activeVersionsForResource([{}], null).size).toBe(0)
  })
})
