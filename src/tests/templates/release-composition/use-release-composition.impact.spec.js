import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

// The impact VM reads the injected `reverseLookupByDs` seam (SEAM 1): a DS -> Workload[]
// index the engine groups by environment. It resolves DS names off the (mocked) deployments
// listing. Mock the same three service seams the sibling suite mocks and spy on raw HTTP /
// fetch so any accidental network/s2s call fails loudly (Property 8).

vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: { useDeploymentsListQuery: vi.fn() }
}))
vi.mock('@/services/v2/deployment/deployment-release-service', () => ({
  deploymentReleaseService: { getActiveReleaseComposition: vi.fn(), buildAndActivate: vi.fn() }
}))
vi.mock('@/services/v2/deployment/resource-catalog-registry', () => ({
  RESOURCE_CATALOG_REGISTRY: {
    application: { versioned: true, listVersions: vi.fn() },
    firewall: { versioned: true, listVersions: vi.fn() },
    function: { versioned: true, listVersions: vi.fn() }
  },
  isVersionedResourceType: (type) => ['application', 'firewall', 'function'].includes(type)
}))

import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { RESOURCE_CATALOG_REGISTRY } from '@/services/v2/deployment/resource-catalog-registry'
import { httpService } from '@/services/v2/base/http/httpService'
import { useReleaseComposition } from '@/templates/release-composition/use-release-composition'

const queryStub = (body = []) => ({
  data: ref({ body }),
  isLoading: ref(false),
  isError: ref(false),
  refetch: vi.fn()
})

// A reverse-lookup workload entry as the SEAM 1 ref carries it: `{ id, name,
// environmentId, environmentName, domains: [...] }`.
const workload = (id, name, environmentId, environmentName, domains) => ({
  id,
  name,
  environmentId,
  environmentName,
  domains
})

let httpSpy
let fetchSpy

beforeEach(() => {
  deploymentService.useDeploymentsListQuery.mockReturnValue(queryStub([]))
  deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(null)
  deploymentReleaseService.buildAndActivate.mockReset()
  RESOURCE_CATALOG_REGISTRY.application.listVersions.mockResolvedValue([])
  RESOURCE_CATALOG_REGISTRY.firewall.listVersions.mockResolvedValue([])
  RESOURCE_CATALOG_REGISTRY.function.listVersions.mockResolvedValue([])

  httpSpy = vi.spyOn(httpService, 'request').mockResolvedValue({ data: {} })
  fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('useReleaseComposition - impact VM (environment grouping + totals)', () => {
  it('groups workloads by environment and sums domains per env and per DS', async () => {
    deploymentService.useDeploymentsListQuery.mockReturnValue(
      queryStub([{ id: 'ds-1', name: 'Checkout DS' }])
    )

    const reverseLookupByDs = ref({
      'ds-1': [
        workload('wl-1', 'web-prod', 'env-prod', 'Production', ['a.com', 'b.com']),
        workload('wl-2', 'api-prod', 'env-prod', 'Production', ['c.com']),
        workload('wl-3', 'web-stg', 'env-stg', 'Staging', ['stg.com'])
      ]
    })

    const { impact } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([]),
      reverseLookupByDs
    })
    await flushPromises()

    expect(impact.value.hasSelection).toBe(true)
    expect(impact.value.impactUnavailable).toBe(false)

    const [ds] = impact.value.perDs
    expect(ds.name).toBe('Checkout DS')
    // 3 distinct workloads, 4 domains total (2 + 1 + 1).
    expect(ds.wlCount).toBe(3)
    expect(ds.domains).toBe(4)

    // Two environments; each env.domains is the sum of its rows' domains.
    expect(ds.environments).toHaveLength(2)
    const byEnv = Object.fromEntries(ds.environments.map((env) => [env.name, env]))
    expect(byEnv.Production.wlCount).toBe(2)
    expect(byEnv.Production.domains).toBe(3)
    expect(byEnv.Production.rows).toEqual([
      { name: 'web-prod', domains: 2 },
      { name: 'api-prod', domains: 1 }
    ])
    expect(byEnv.Staging.wlCount).toBe(1)
    expect(byEnv.Staging.domains).toBe(1)
    expect(byEnv.Staging.rows).toEqual([{ name: 'web-stg', domains: 1 }])

    expect(httpSpy).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('counts a workload present in two environments as ONE distinct workload', async () => {
    deploymentService.useDeploymentsListQuery.mockReturnValue(
      queryStub([{ id: 'ds-1', name: 'Shared DS' }])
    )

    // The SAME workload id (wl-shared) shows up in two environment branches of the
    // same DS. wlCount must count it ONCE (distinct by id) though it renders twice.
    const reverseLookupByDs = ref({
      'ds-1': [
        workload('wl-shared', 'multi-env', 'env-prod', 'Production', ['p.com']),
        workload('wl-shared', 'multi-env', 'env-stg', 'Staging', ['s.com'])
      ]
    })

    const { impact } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([]),
      reverseLookupByDs
    })
    await flushPromises()

    const [ds] = impact.value.perDs
    // Distinct by id => 1, even though it appears in both environment branches.
    expect(ds.wlCount).toBe(1)
    expect(ds.environments).toHaveLength(2)
    const envWlCounts = ds.environments.map((env) => env.wlCount)
    expect(envWlCounts).toEqual([1, 1])
    // Domains still sum every occurrence across environments.
    expect(ds.domains).toBe(2)
  })

  it('footer totals aggregate dsCount, distinct workloads and domains across all DSs', async () => {
    deploymentService.useDeploymentsListQuery.mockReturnValue(
      queryStub([
        { id: 'ds-1', name: 'DS One' },
        { id: 'ds-2', name: 'DS Two' }
      ])
    )

    const reverseLookupByDs = ref({
      'ds-1': [
        workload('wl-1', 'a', 'env-prod', 'Production', ['x.com', 'y.com']),
        workload('wl-2', 'b', 'env-stg', 'Staging', ['z.com'])
      ],
      'ds-2': [workload('wl-3', 'c', 'env-prod', 'Production', ['w.com'])]
    })

    const { impact } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1', 'ds-2']),
      versionedResources: ref([]),
      reverseLookupByDs
    })
    await flushPromises()

    // dsCount = number of selected DSs; totalWorkloads = sum of per-DS wlCount
    // (2 + 1); totalDomains = sum of per-DS domains (3 + 1).
    expect(impact.value.totals).toEqual({
      dsCount: 2,
      totalWorkloads: 3,
      totalDomains: 4
    })
    expect(impact.value.perDs.map((entry) => entry.wlCount)).toEqual([2, 1])
    expect(impact.value.perDs.map((entry) => entry.domains)).toEqual([3, 1])
  })

  it('nothing selected => hasSelection false with zeroed totals', async () => {
    const { impact } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([]),
      reverseLookupByDs: ref({})
    })
    await flushPromises()

    expect(impact.value.hasSelection).toBe(false)
    expect(impact.value.impactUnavailable).toBe(false)
    expect(impact.value.perDs).toEqual([])
    expect(impact.value.totals).toEqual({ dsCount: 0, totalDomains: 0, totalWorkloads: 0 })
  })
})
