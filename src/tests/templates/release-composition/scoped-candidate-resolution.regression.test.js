import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

// ---------------------------------------------------------------------------
// REGRESSION (Fase 6, Issue 1) — the scoped candidate set must populate from a
// REAL resolver, NOT the composable's `scanLoadedReleases` default.
//
// The bug: a scoped (Scenario B) entry opens with `deploymentIds: []`, so NO
// active releases are loaded. The composable's default `resolveConsuming`
// (`scanLoadedReleases`) only scans `activeReleaseByDs` (the already-SELECTED
// DSs), so on a scoped entry it resolves to `[]` → the picker filters to the
// empty candidate set → zero rows → the user cannot select/publish.
//
// The existing `use-release-composition.test.js` MISSES this class of bug because
// it exercises `resolveConsumingDsIds` only after pre-selecting DSs (so the scan
// has data). This suite proves the fix end-to-end: with `selectedDsIds: []` (the
// scoped-entry condition), an INJECTED real resolver — built over service-fakes,
// not a hand-mocked resolver fn — still resolves the consuming-DS candidates.
//
// It also covers the composed `selectResolver()` (resource-usage → fan-out
// fallback) so the runtime wiring populates candidates with OR without the
// `GET /v4/resource_usage` endpoint being live (Issue 1's robustness clause).
// ---------------------------------------------------------------------------

vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: { useDeploymentsListQuery: vi.fn() }
}))
vi.mock('@/services/v2/deployment/deployment-release-service', () => ({
  deploymentReleaseService: { getActiveReleaseComposition: vi.fn(), buildAndActivate: vi.fn() }
}))
vi.mock('@/services/v2/deployment/resource-catalog-registry', () => ({
  RESOURCE_CATALOG_REGISTRY: {},
  isVersionedResourceType: () => false
}))

import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { useReleaseComposition } from '@/templates/release-composition/use-release-composition'
import {
  createFanoutResolver,
  createResourceUsageResolver,
  selectResolver
} from '@/services/v2/release-impact/consuming-deployments'

const queryStub = (body = []) => ({
  data: ref({ body }),
  isLoading: ref(false),
  isError: ref(false),
  refetch: vi.fn()
})

// A tenant scenario expressed purely as data: the DS inventory + each DS's
// active release. Both the fan-out service-fakes and the resource-usage
// service-fake are derived from THIS, so the resolvers see real inventory data
// the composable never pre-loaded.
const scenario = {
  dsIds: ['ds-1', 'ds-2', 'ds-3'],
  releaseByDs: {
    'ds-1': {
      resources: [
        { resource_type: 'application', global_id: 42, version_id: 'app-live' },
        { resource_type: 'firewall', resource_id: 7, version_id: 'fw-live' }
      ]
    },
    // ds-2 consumes the same application (so the candidate union has 2 entries).
    'ds-2': {
      resources: [{ resource_type: 'application', global_id: 42, version_id: 'app-live-2' }]
    },
    // ds-3 consumes a different application — must NOT be a candidate.
    'ds-3': {
      resources: [{ resource_type: 'application', global_id: 99, version_id: 'other' }]
    }
  }
}

// Fan-out service-fakes (list DS + scan each active release), derived from the
// scenario — exactly the production seam shape (`{ body, count }` + per-DS
// active release).
const fanoutServices = () => ({
  deploymentService: {
    listDeploymentsService: () =>
      Promise.resolve({
        body: scenario.dsIds.map((id) => ({ id })),
        count: scenario.dsIds.length
      })
  },
  deploymentReleaseService: {
    getActiveReleaseComposition: (dsId) =>
      Promise.resolve(scenario.releaseByDs[dsId] ?? { resources: [] })
  }
})

// Resource-usage service-fake (one row per consuming DS), derived from the SAME
// scenario — `application` matched by `global_id`.
const resourceUsageServices = () => ({
  resourceUsageService: {
    listResourceUsage: ({ resourceType, resourceIds }) => {
      const wanted = new Set(resourceIds.map(String))
      const rows = scenario.dsIds
        .map((dsId) => {
          const matched = (scenario.releaseByDs[dsId]?.resources ?? []).filter((resource) => {
            if (resource.resource_type !== resourceType) return false
            const idField =
              resourceType === 'application' ? resource.global_id : resource.resource_id
            return wanted.has(String(idField))
          })
          if (matched.length === 0) return null
          return {
            deployment_id: dsId,
            resources: matched.map((resource) => ({
              resource_type: resource.resource_type,
              resource_id: resource.resource_id,
              global_id: resource.global_id,
              resource_version: resource.version_id
            }))
          }
        })
        .filter(Boolean)
      return Promise.resolve({ body: rows, count: rows.length })
    }
  }
})

beforeEach(() => {
  // The composable lists NO deployments and pre-loads NO active releases — the
  // exact scoped-entry runtime condition (`deploymentIds: []`).
  deploymentService.useDeploymentsListQuery.mockReturnValue(queryStub([]))
  deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(null)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('scoped candidate resolution — injected REAL resolver populates candidates with NO pre-loaded DSs', () => {
  it('the DEFAULT (scanLoadedReleases) resolves to [] on a scoped entry — the bug it replaces', async () => {
    // Demonstrates the regression: with no injected resolver and no selected DSs,
    // the default scan has nothing to scan, so the candidate set is empty.
    const { resolveConsumingDeployments } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([])
    })
    await flushPromises()

    const result = await resolveConsumingDeployments({
      resource_type: 'application',
      resource_id: 42
    })
    expect(result.deployments).toEqual([])
  })

  it('an injected fan-out resolver populates candidates over real inventory (selectedDsIds: [])', async () => {
    const { resolveConsumingDeployments } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([]),
      resolveConsumingDeployments: createFanoutResolver(fanoutServices())
    })
    await flushPromises()

    const result = await resolveConsumingDeployments({
      resource_type: 'application',
      resource_id: 42
    })
    const ids = result.deployments.map((entry) => String(entry.deploymentId)).sort()
    // Both DSs consuming application 42 are candidates; ds-3 (app 99) is excluded.
    expect(ids).toEqual(['ds-1', 'ds-2'])
  })

  it('an injected resource-usage resolver populates candidates over real inventory (selectedDsIds: [])', async () => {
    const { resolveConsumingDeployments } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([]),
      resolveConsumingDeployments: createResourceUsageResolver(resourceUsageServices())
    })
    await flushPromises()

    const result = await resolveConsumingDeployments({
      resource_type: 'application',
      resource_id: 42
    })
    const ids = result.deployments.map((entry) => String(entry.deploymentId)).sort()
    expect(ids).toEqual(['ds-1', 'ds-2'])
  })

  it('the view-side mapping (result.deployments -> candidate id strings) yields non-empty rows', async () => {
    // Mirrors ReleaseComposerView.onMounted: resolve, then map deployments to the
    // string candidate ids the picker filters on. With the fix this is non-empty,
    // so the picker lists the consuming-DS rows (the runtime symptom that broke).
    const { resolveConsumingDeployments } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([]),
      resolveConsumingDeployments: createFanoutResolver(fanoutServices())
    })
    await flushPromises()

    const result = await resolveConsumingDeployments({
      resource_type: 'application',
      resource_id: 42
    })
    const candidateDsIds = (result?.deployments ?? []).map((entry) => String(entry.deploymentId))

    expect(candidateDsIds.length).toBeGreaterThan(0)
    expect(new Set(candidateDsIds)).toEqual(new Set(['ds-1', 'ds-2']))
  })
})

describe('selectResolver() composed strategy — resource-usage with fan-out fallback (Issue 1 robustness)', () => {
  it('resolves via resource-usage when the endpoint is live', async () => {
    const resolve = selectResolver(resourceUsageServices())

    const result = await resolve({ resource_type: 'application', resource_id: 42 })
    const ids = result.deployments.map((entry) => String(entry.deploymentId)).sort()
    expect(ids).toEqual(['ds-1', 'ds-2'])
  })

  it('falls back to the fan-out when resource-usage throws (endpoint not live)', async () => {
    // Inject BOTH a throwing resource-usage service AND the fan-out services in
    // the same deps bag: the composed resolver must catch the primary failure and
    // degrade to the fan-out, still producing the candidate union.
    const resolve = selectResolver({
      resourceUsageService: {
        listResourceUsage: () => Promise.reject(new Error('resource_usage not available'))
      },
      ...fanoutServices()
    })

    const result = await resolve({ resource_type: 'application', resource_id: 42 })
    const ids = result.deployments.map((entry) => String(entry.deploymentId)).sort()
    expect(ids).toEqual(['ds-1', 'ds-2'])
  })
})
