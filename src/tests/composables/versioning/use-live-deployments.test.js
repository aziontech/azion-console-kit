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

  it('produces one row per (version, deployment) pair with enrichment', () => {
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

    expect(liveDeployments.value).toHaveLength(2)
    expect(liveDeployments.value[0]).toMatchObject({
      versionId: 'v1',
      environment: 'prod',
      workload: null,
      deployedAt: '2026-01-01T00:00:00Z'
    })
    expect(liveDeployments.value[0].version).toMatchObject({ id: 'v1', label: 'Version 1' })
    expect(liveDeployments.value[1].environment).toBe('staging')
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

    expect(liveDeployments.value[0].deployedAt).toBe('2026-03-05T12:00:00Z')
    expect(liveDeployments.value[0].environment).toBeNull()
    expect(liveDeployments.value[0].workload).toBeNull()
  })

  it('unwraps a computed/ref workloadResolver', () => {
    const resolverRef = ref(nameBasedResolver)
    const activeVersions = new Map([['v1', { deployments: [{ id: 'd1', name: 'prod' }] }]])

    const { liveDeployments } = useLiveDeployments({
      activeVersions: computed(() => activeVersions),
      versions: computed(() => []),
      workloadResolver: resolverRef
    })

    expect(liveDeployments.value[0].environment).toBe('prod')
  })

  it('skips entries where deployments is not an array', () => {
    const activeVersions = new Map([
      ['v1', { deployments: null }],
      ['v2', { deployments: [{ id: 'd1', name: 'prod' }] }]
    ])

    const { liveDeployments } = useLiveDeployments({
      activeVersions: () => activeVersions,
      versions: () => [],
      workloadResolver: nameBasedResolver
    })

    expect(liveDeployments.value).toHaveLength(1)
    expect(liveDeployments.value[0].versionId).toBe('v2')
  })
})
