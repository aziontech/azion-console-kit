/**
 * Behavioral contract test for the Impact engine inside `useReleaseComposition`
 * (spec task 7.3, Property 5).
 *
 * Property 5 — the Impact engine consumes the injected `reverseLookupByDs` ref
 *   WITHOUT a change in behavior:
 *
 *     Given a `reverseLookupByDs` fixture injected through the factory arg
 *     (SEAM 1, design §7.2), `impact()` produces exactly the tree + totals that
 *     `buildDsImpact`/`impact` derive from that ref — no fabrication, no extra
 *     reads. The engine is byte-for-byte unchanged (req 9.5); this test pins its
 *     observable contract so a future edit that DID change behavior would fail.
 *
 * Validates requirement 9.5.
 *
 * This is a BEHAVIORAL CONTRACT test (not a PBT): it does not require fast-check.
 * It exercises the real composable with the IO services stubbed (no fetch/axios
 * ever runs), injects a hand-built reverse-lookup ref, and asserts the engine's
 * output. Stubbing only the IO seams keeps the engine itself under test.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'

// --- IO seams stubbed: the engine must run with zero real fetch/axios --------
// `use-release-composition.js` calls `useDeploymentsListQuery` at setup and
// `getActiveReleaseComposition` from a `selectedDsIds` watcher. We stub both so
// the composable is constructible in a test without touching the network; the
// Impact engine under test reads `deployments` (names) + the injected ref only.

// `vi.mock` factories are hoisted above the module, so the shared stubs they
// reference must be created with `vi.hoisted` (also hoisted) — this lets the
// tests mutate `deploymentsData` while the mocked services read the same ref.
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

// The version pickers' registry: no resource is versioned in these fixtures, so
// an empty registry keeps the version watcher inert (no IO, no options loaded).
vi.mock('@/services/v2/deployment/resource-catalog-registry', () => ({
  RESOURCE_CATALOG_REGISTRY: {}
}))

import { useReleaseComposition } from './use-release-composition'

// Set the deployments listing the engine reads for DS display names.
const setDeployments = (list) => {
  deploymentsData.value = { body: list }
}

// A reverse-lookup row exactly as `buildReverseLookupByDs` emits it (design §3.2):
// the engine reads { id, name, domains, environmentId, environmentName } only.
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

    // Injected fixture: ds-1 has two workloads in one env (3 domains total),
    // ds-2 has a single workload in another env (1 domain).
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

    // Per-DS tree: name resolved from the deployments listing, env from the
    // first env of the injected ref, domains/wlCount derived per DS, and one row
    // per workload carrying its domain count.
    expect(result.perDs).toEqual([
      {
        name: 'Storefront',
        env: 'Production',
        domains: 3,
        wlCount: 2,
        rows: [
          { name: 'web-a', domains: 2 },
          { name: 'web-b', domains: 1 }
        ]
      },
      {
        name: 'Checkout',
        env: 'Staging',
        domains: 1,
        wlCount: 1,
        rows: [{ name: 'api-c', domains: 1 }]
      }
    ])

    // Aggregate totals are the sum across the selected DS.
    expect(result.totals).toEqual({
      dsCount: 2,
      totalWorkloads: 3,
      totalDomains: 4
    })
  })

  it('groups workloads of one DS by environment in the engine tree', () => {
    setDeployments([{ id: 'ds-1', name: 'Multi-env DS' }])

    // Two workloads in distinct environments under the SAME DS: the engine groups
    // by `environmentId`, and the per-DS `env` shows the FIRST environment only.
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
    expect(entry.env).toBe('Production')
    expect(entry.wlCount).toBe(2)
    expect(entry.domains).toBe(3)
    // Rows preserve workload order across environments (flattened tree).
    expect(entry.rows).toEqual([
      { name: 'prod-wl', domains: 2 },
      { name: 'stage-wl', domains: 1 }
    ])
  })

  it('degrades to unavailable when ANY selected DS is missing from the ref (no fabrication)', () => {
    setDeployments([
      { id: 'ds-1', name: 'Has data' },
      { id: 'ds-2', name: 'No data' }
    ])

    // ds-1 resolved, ds-2 absent => the engine reports unavailable with ZERO rows
    // but keeps the REAL selection count (Property 8: never invent impact rows).
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
    expect(result.impactUnavailable).toBe(true)
    expect(result.perDs).toEqual([])
    expect(result.totals).toEqual({ dsCount: 2, totalDomains: 0, totalWorkloads: 0 })
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

    // Start with the DS unresolved => degraded. Then populate the SAME injected
    // ref and assert the engine re-derives the tree from it with no other input:
    // proof the engine reads the ref it was handed, byte-for-byte (req 9.5).
    const reverseLookupByDs = ref({})

    const { impact } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref(['ds-1']),
      reverseLookupByDs
    })

    expect(impact.value.impactUnavailable).toBe(true)
    expect(impact.value.perDs).toEqual([])

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
        name: 'Storefront',
        env: 'Production',
        domains: 2,
        wlCount: 1,
        rows: [{ name: 'web-a', domains: 2 }]
      }
    ])
    expect(result.totals).toEqual({ dsCount: 1, totalWorkloads: 1, totalDomains: 2 })
  })

  it('treats an empty workload array for a DS as resolved-with-zero (not unavailable)', () => {
    setDeployments([{ id: 'ds-1', name: 'Empty DS' }])

    // An empty array is PRESENT data (the DS has no active workloads), distinct
    // from an absent key: the engine renders a zero-row, zero-total entry.
    const reverseLookupByDs = ref({ 'ds-1': [] })

    const { impact } = useReleaseComposition({
      enabled: false,
      selectedDsIds: ref(['ds-1']),
      reverseLookupByDs
    })

    const result = impact.value
    expect(result.impactUnavailable).toBe(false)
    expect(result.perDs).toEqual([
      { name: 'Empty DS', env: null, domains: 0, wlCount: 0, rows: [] }
    ])
    expect(result.totals).toEqual({ dsCount: 1, totalWorkloads: 0, totalDomains: 0 })
  })

  it('falls back to the DS id as the name when the deployments listing lacks it', () => {
    // No deployments loaded => the engine uses the id string as the display name,
    // still reading env/domains from the injected ref (no fabricated name).
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
    expect(entry.env).toBe('Env One')
    expect(entry.domains).toBe(1)
  })
})
