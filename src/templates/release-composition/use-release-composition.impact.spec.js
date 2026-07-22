import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'

const { deploymentsData, useDeploymentsListQuery, getActiveReleaseComposition, buildAndActivate } =
  await vi.hoisted(async () => {
    const { ref: hoistedRef } = await import('vue')
    const data = hoistedRef({ body: [] })
    return {
      deploymentsData: data,
      useDeploymentsListQuery: vi.fn(() => ({
        data,
        isLoading: hoistedRef(false),
        isError: hoistedRef(false),
        refetch: vi.fn()
      })),
      getActiveReleaseComposition: vi.fn(() => Promise.resolve(null)),
      buildAndActivate: vi.fn(() => Promise.resolve({}))
    }
  })

vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: { useDeploymentsListQuery }
}))

vi.mock('@/services/v2/deployment/deployment-release-service', () => ({
  deploymentReleaseService: { getActiveReleaseComposition, buildAndActivate }
}))

vi.mock('@/services/v2/deployment/resource-catalog-registry', () => ({
  RESOURCE_CATALOG_REGISTRY: {}
}))

import { useReleaseComposition } from './use-release-composition'

const setDeployments = (list) => {
  deploymentsData.value = { body: list }
}

const row = ({ id, name, domains = [], environmentId = null, environmentName = null }) => ({
  id,
  name,
  domains,
  environmentId,
  environmentName
})

describe('useReleaseComposition — Impact engine behavioral contract (Property 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deploymentsData.value = { body: [] }
  })

  it('builds the per-DS tree + totals from the injected reverseLookupByDs ref', () => {
    setDeployments([
      { id: 'ds-1', name: 'Storefront' },
      { id: 'ds-2', name: 'Checkout' }
    ])

    const reverseLookupByDs = ref({
      'ds-1': [
        row({
          id: 'wl-a',
          name: 'web-a',
          domains: ['a1.example.com', 'a2.example.com'],
          environmentId: 'env-prod',
          environmentName: 'Production'
        }),
        row({
          id: 'wl-b',
          name: 'web-b',
          domains: ['b1.example.com'],
          environmentId: 'env-prod',
          environmentName: 'Production'
        })
      ],
      'ds-2': [
        row({
          id: 'wl-c',
          name: 'api-c',
          domains: ['c1.example.com'],
          environmentId: 'env-stage',
          environmentName: 'Staging'
        })
      ]
    })

    const { impact } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref(['ds-1', 'ds-2']),
      reverseLookupByDs
    })

    const result = impact.value

    expect(result.hasSelection).toBe(true)
    expect(result.impactUnavailable).toBe(false)

    expect(result.perDs).toEqual([
      {
        deploymentId: 'ds-1',
        name: 'Storefront',
        domains: 3,
        wlCount: 2,
        environments: [
          {
            name: 'Production',
            wlCount: 2,
            domains: 3,
            rows: [
              { name: 'web-a', domains: 2 },
              { name: 'web-b', domains: 1 }
            ]
          }
        ]
      },
      {
        deploymentId: 'ds-2',
        name: 'Checkout',
        domains: 1,
        wlCount: 1,
        environments: [
          {
            name: 'Staging',
            wlCount: 1,
            domains: 1,
            rows: [{ name: 'api-c', domains: 1 }]
          }
        ]
      }
    ])

    expect(result.totals).toEqual({
      dsCount: 2,
      totalWorkloads: 3,
      totalDomains: 4
    })
  })

  it('groups workloads of one DS by environment in the engine tree', () => {
    setDeployments([{ id: 'ds-1', name: 'Multi-env DS' }])

    const reverseLookupByDs = ref({
      'ds-1': [
        row({
          id: 'wl-prod',
          name: 'prod-wl',
          domains: ['p1.example.com', 'p2.example.com'],
          environmentId: 'env-prod',
          environmentName: 'Production'
        }),
        row({
          id: 'wl-stage',
          name: 'stage-wl',
          domains: ['s1.example.com'],
          environmentId: 'env-stage',
          environmentName: 'Staging'
        })
      ]
    })

    const { impact } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref(['ds-1']),
      reverseLookupByDs
    })

    const entry = impact.value.perDs[0]
    expect(entry.wlCount).toBe(2)
    expect(entry.domains).toBe(3)
    expect(entry.environments).toEqual([
      { name: 'Production', wlCount: 1, domains: 2, rows: [{ name: 'prod-wl', domains: 2 }] },
      { name: 'Staging', wlCount: 1, domains: 1, rows: [{ name: 'stage-wl', domains: 1 }] }
    ])
  })

  it('treats a DS absent from the ref as resolved-with-zero (non-blocking, no fabrication)', () => {
    setDeployments([
      { id: 'ds-1', name: 'Has data' },
      { id: 'ds-2', name: 'No data' }
    ])

    const reverseLookupByDs = ref({
      'ds-1': [row({ id: 'wl-a', name: 'web-a', domains: ['a1.example.com'] })]
    })

    const { impact } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref(['ds-1', 'ds-2']),
      reverseLookupByDs
    })

    const result = impact.value
    expect(result.hasSelection).toBe(true)
    expect(result.impactUnavailable).toBe(false)
    expect(result.perDs).toEqual([
      {
        deploymentId: 'ds-1',
        name: 'Has data',
        domains: 1,
        wlCount: 1,
        environments: [
          { name: null, wlCount: 1, domains: 1, rows: [{ name: 'web-a', domains: 1 }] }
        ]
      },
      {
        deploymentId: 'ds-2',
        name: 'No data',
        domains: 0,
        wlCount: 0,
        environments: []
      }
    ])
    expect(result.totals).toEqual({ dsCount: 2, totalDomains: 1, totalWorkloads: 1 })
  })

  it('reports no impact (not unavailable) when nothing is selected', () => {
    const { impact } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref([]),
      reverseLookupByDs: ref({})
    })

    const result = impact.value
    expect(result.hasSelection).toBe(false)
    expect(result.impactUnavailable).toBe(false)
    expect(result.perDs).toEqual([])
    expect(result.totals).toEqual({ dsCount: 0, totalDomains: 0, totalWorkloads: 0 })
  })

  it('consumes the injected ref REACTIVELY and unchanged (mutation flows through the engine)', async () => {
    setDeployments([{ id: 'ds-1', name: 'Storefront' }])

    const reverseLookupByDs = ref({})

    const { impact } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref(['ds-1']),
      reverseLookupByDs
    })

    expect(impact.value.impactUnavailable).toBe(false)
    expect(impact.value.perDs).toEqual([
      { deploymentId: 'ds-1', name: 'Storefront', domains: 0, wlCount: 0, environments: [] }
    ])

    reverseLookupByDs.value = {
      'ds-1': [
        row({
          id: 'wl-a',
          name: 'web-a',
          domains: ['a1.example.com', 'a2.example.com'],
          environmentId: 'env-prod',
          environmentName: 'Production'
        })
      ]
    }
    await nextTick()

    const result = impact.value
    expect(result.impactUnavailable).toBe(false)
    expect(result.perDs).toEqual([
      {
        deploymentId: 'ds-1',
        name: 'Storefront',
        domains: 2,
        wlCount: 1,
        environments: [
          { name: 'Production', wlCount: 1, domains: 2, rows: [{ name: 'web-a', domains: 2 }] }
        ]
      }
    ])
    expect(result.totals).toEqual({ dsCount: 1, totalWorkloads: 1, totalDomains: 2 })
  })

  it('treats an empty workload array for a DS as resolved-with-zero (not unavailable)', () => {
    setDeployments([{ id: 'ds-1', name: 'Empty DS' }])

    const reverseLookupByDs = ref({ 'ds-1': [] })

    const { impact } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref(['ds-1']),
      reverseLookupByDs
    })

    const result = impact.value
    expect(result.impactUnavailable).toBe(false)
    expect(result.perDs).toEqual([
      { deploymentId: 'ds-1', name: 'Empty DS', domains: 0, wlCount: 0, environments: [] }
    ])
    expect(result.totals).toEqual({ dsCount: 1, totalWorkloads: 0, totalDomains: 0 })
  })

  it('falls back to the DS id as the name when the deployments listing lacks it', () => {
    const reverseLookupByDs = ref({
      'ds-orphan': [
        row({
          id: 'wl-x',
          name: 'x',
          domains: ['x1.example.com'],
          environmentId: 'env-1',
          environmentName: 'Env One'
        })
      ]
    })

    const { impact } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref(['ds-orphan']),
      reverseLookupByDs
    })

    const entry = impact.value.perDs[0]
    expect(entry.name).toBe('ds-orphan')
    expect(entry.environments[0].name).toBe('Env One')
    expect(entry.domains).toBe(1)
  })
})
