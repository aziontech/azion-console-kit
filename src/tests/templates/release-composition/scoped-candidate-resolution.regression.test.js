import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

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

const scenario = {
  dsIds: ['ds-1', 'ds-2', 'ds-3'],
  releaseByDs: {
    'ds-1': {
      resources: [
        { resource_type: 'application', global_id: 42, version_id: 'app-live' },
        { resource_type: 'firewall', resource_id: 7, version_id: 'fw-live' }
      ]
    },
    'ds-2': {
      resources: [{ resource_type: 'application', global_id: 42, version_id: 'app-live-2' }]
    },
    'ds-3': {
      resources: [{ resource_type: 'application', global_id: 99, version_id: 'other' }]
    }
  }
}

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
  deploymentService.useDeploymentsListQuery.mockReturnValue(queryStub([]))
  deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(null)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('scoped candidate resolution — injected REAL resolver populates candidates with NO pre-loaded DSs', () => {
  it('the DEFAULT (scanLoadedReleases) resolves to [] on a scoped entry — the bug it replaces', async () => {
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
