import { describe, it, expect } from 'vitest'
import { computed, ref } from 'vue'
import { useLiveDeployments } from '@/composables/versioning/use-live-deployments'

const nameBasedResolver = {
  resolve(deployment) {
    return {
      environment: deployment?.name ?? null,
      workload: null,
      deployedAt: deployment?.deployedAt ?? null
    }
  }
}

describe('useLiveDeployments', () => {
  it('returns [] when activeVersions is empty or not a Map', () => {
    const empty = useLiveDeployments({
      activeVersions: () => new Map(),
      versions: () => [],
      workloadResolver: nameBasedResolver
    })
    expect(empty.liveDeployments.value).toEqual([])

    const bad = useLiveDeployments({
      activeVersions: () => null,
      versions: () => [],
      workloadResolver: nameBasedResolver
    })
    expect(bad.liveDeployments.value).toEqual([])
  })

  it('folds N deployments of the same version into ONE row with N environments', () => {
    const versions = [{ id: 'v1', label: 'Version 1' }]
    const activeVersions = new Map([
      [
        'v1',
        {
          deployments: [
            { id: 'd1', name: 'prod', deployedAt: '2026-01-01T00:00:00Z' },
            { id: 'd2', name: 'staging', deployedAt: '2026-01-02T00:00:00Z' }
          ]
        }
      ]
    ])

    const { liveDeployments } = useLiveDeployments({
      activeVersions: () => activeVersions,
      versions: () => versions,
      workloadResolver: nameBasedResolver
    })

    expect(liveDeployments.value).toHaveLength(1)
    const [row] = liveDeployments.value
    expect(row.versionId).toBe('v1')
    expect(row.environments).toEqual(['prod', 'staging'])
    expect(row.workloads).toEqual([])
    expect(row.deployments).toHaveLength(2)
    // latestDeployedAt is the most recent across the deployments.
    expect(row.latestDeployedAt).toBe('2026-01-02T00:00:00Z')
    expect(row.version).toMatchObject({ id: 'v1', label: 'Version 1' })
  })

  it('produces one row per DISTINCT version, keeping order deterministic', () => {
    const activeVersions = new Map([
      ['v1', { deployments: [{ id: 'd1', name: 'prod' }] }],
      ['v2', { deployments: [{ id: 'd2', name: 'canary' }] }]
    ])

    const { liveDeployments } = useLiveDeployments({
      activeVersions: () => activeVersions,
      versions: () => [],
      workloadResolver: nameBasedResolver
    })

    expect(liveDeployments.value).toHaveLength(2)
    expect(liveDeployments.value.map((row) => row.versionId)).toEqual(['v1', 'v2'])
  })

  it('falls back to deployment.deployedAt when the resolver omits it', () => {
    const nullResolver = { resolve: () => ({}) }
    const activeVersions = new Map([
      ['v1', { deployments: [{ id: 'd1', name: 'prod', deployedAt: '2026-03-05T12:00:00Z' }] }]
    ])

    const { liveDeployments } = useLiveDeployments({
      activeVersions: () => activeVersions,
      versions: () => [],
      workloadResolver: nullResolver
    })

    expect(liveDeployments.value[0].latestDeployedAt).toBe('2026-03-05T12:00:00Z')
    expect(liveDeployments.value[0].environments).toEqual([])
    expect(liveDeployments.value[0].workloads).toEqual([])
  })

  it('unwraps a computed/ref workloadResolver', () => {
    const resolverRef = ref(nameBasedResolver)
    const activeVersions = new Map([['v1', { deployments: [{ id: 'd1', name: 'prod' }] }]])

    const { liveDeployments } = useLiveDeployments({
      activeVersions: computed(() => activeVersions),
      versions: computed(() => []),
      workloadResolver: resolverRef
    })

    expect(liveDeployments.value[0].environments).toEqual(['prod'])
  })

  it('skips versions with no active deployments', () => {
    const activeVersions = new Map([
      ['v1', { deployments: null }],
      ['v2', { deployments: [] }],
      ['v3', { deployments: [{ id: 'd1', name: 'prod' }] }]
    ])

    const { liveDeployments } = useLiveDeployments({
      activeVersions: () => activeVersions,
      versions: () => [],
      workloadResolver: nameBasedResolver
    })

    expect(liveDeployments.value).toHaveLength(1)
    expect(liveDeployments.value[0].versionId).toBe('v3')
  })

  it('deduplicates repeated environment/workload names within a version', () => {
    const activeVersions = new Map([
      [
        'v1',
        {
          deployments: [
            { id: 'd1', name: 'prod' },
            { id: 'd2', name: 'prod' }
          ]
        }
      ]
    ])

    const resolver = {
      resolve(deployment) {
        return { environment: deployment?.name ?? null, workload: 'wl-a', deployedAt: null }
      }
    }

    const { liveDeployments } = useLiveDeployments({
      activeVersions: () => activeVersions,
      versions: () => [],
      workloadResolver: resolver
    })

    expect(liveDeployments.value[0].environments).toEqual(['prod'])
    expect(liveDeployments.value[0].workloads).toEqual(['wl-a'])
    expect(liveDeployments.value[0].deployments).toHaveLength(2)
  })
})
