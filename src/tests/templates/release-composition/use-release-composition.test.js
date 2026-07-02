import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

// The composable orchestrates ONLY the injected v2 services + the catalog
// registry. It must never reach the service-to-service reverse-lookup endpoint
// (verified 401, spec §K) nor any raw HTTP path. Mock all three seams and, on
// top of that, spy on `httpService.request` and the global `fetch` so any
// accidental network/s2s call would fail the assertions loudly (Property 8).

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
import {
  useReleaseComposition,
  BUILD_AND_ACTIVATE_ERROR_TYPES,
  VERSIONED_URLS_ACTIVE_LIMIT_CODE,
  SCOPED_PUBLISH_SKIP_REASONS
} from '@/templates/release-composition/use-release-composition'

// Mirrors the `useQuery`-shaped object the composable reads from
// `useDeploymentsListQuery` (`data.value.body`, `isLoading`, `isError`, `refetch`).
const queryStub = (body = []) => ({
  data: ref({ body }),
  isLoading: ref(false),
  isError: ref(false),
  refetch: vi.fn()
})

// An active release as returned by `getActiveReleaseComposition`: a raw
// `{ resources: [...] }` where `application` is keyed by `global_id` and every
// other type by `resource_id`, with the version pinned in `version_id`.
const release = (resources) => ({ resources })

let httpSpy
let fetchSpy

beforeEach(() => {
  deploymentService.useDeploymentsListQuery.mockReturnValue(queryStub([]))
  deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(null)
  deploymentReleaseService.buildAndActivate.mockReset()
  RESOURCE_CATALOG_REGISTRY.application.listVersions.mockResolvedValue([])
  RESOURCE_CATALOG_REGISTRY.firewall.listVersions.mockResolvedValue([])
  RESOURCE_CATALOG_REGISTRY.function.listVersions.mockResolvedValue([])

  // Any HTTP or s2s/GraphQL attempt would have to go through one of these two.
  httpSpy = vi.spyOn(httpService, 'request').mockResolvedValue({ data: {} })
  fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('useReleaseComposition - Property 8 (impact never fabricated)', () => {
  it('empty state: no DS selected => impact available-but-empty, no rows, zeroed totals', async () => {
    const { impact, impactUnavailable } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([])
    })
    await flushPromises()

    // req 7.1: nothing selected is "no impact to preview", NOT "unavailable". The
    // panel reads `totals` unguarded, so it is a zeroed object (NOT null) with no
    // fabricated rows — Scenario B opens here with 0 DSs selected (req 3.9).
    expect(impactUnavailable.value).toBe(false)
    expect(impact.value.hasSelection).toBe(false)
    expect(impact.value.perDs).toEqual([])
    expect(impact.value.totals).toEqual({ dsCount: 0, totalDomains: 0, totalWorkloads: 0 })
  })

  it('degraded state: DS selected but no reverse-lookup => unavailable, zero rows, real dsCount only', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(
      release([{ resource_type: 'application', global_id: 42, version_id: 'app-live' }])
    )

    const { impact, impactUnavailable } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1', 'ds-2']),
      versionedResources: ref([])
    })
    await flushPromises()

    // No reverse-lookup data for these DSs, so impact degrades. Nothing synthetic
    // is produced (zero rows, zero workloads/domains) but `totals.dsCount` still
    // reflects the REAL selection so the panel can show "{N} selected" (Property 8).
    expect(impactUnavailable.value).toBe(true)
    expect(impact.value.hasSelection).toBe(true)
    expect(impact.value.perDs).toEqual([])
    expect(impact.value.perDs).toHaveLength(0)
    expect(impact.value.totals).toEqual({ dsCount: 2, totalDomains: 0, totalWorkloads: 0 })
  })

  it('never invents environments/workloads/domains/counts for a selected DS', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(
      release([
        { resource_type: 'application', global_id: 1, version_id: 'v1' },
        { resource_type: 'firewall', resource_id: 7, version_id: 'fw1' }
      ])
    )

    const { impact } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([])
    })
    await flushPromises()

    // Even with an active release loaded (so resources are known), there is no
    // blast-radius data — impact must stay strictly empty (no derived rows), with
    // only the REAL dsCount surfaced (no fabricated workloads/domains).
    expect(impact.value).toEqual({
      hasSelection: true,
      impactUnavailable: true,
      perDs: [],
      totals: { dsCount: 1, totalDomains: 0, totalWorkloads: 0 }
    })
  })

  it('retryImpact stays a no-op beyond the deployments refetch and fabricates nothing', async () => {
    const stub = queryStub([])
    deploymentService.useDeploymentsListQuery.mockReturnValue(stub)
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(
      release([{ resource_type: 'application', global_id: 9, version_id: 'v9' }])
    )

    const { impact, impactUnavailable, retryImpact } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([])
    })
    await flushPromises()

    retryImpact()
    await flushPromises()

    expect(stub.refetch).toHaveBeenCalledTimes(1)
    expect(impactUnavailable.value).toBe(true)
    expect(impact.value.perDs).toEqual([])
    expect(impact.value.totals).toEqual({ dsCount: 1, totalDomains: 0, totalWorkloads: 0 })
  })

  it('never exercises a GraphQL/fetch/s2s path - only the injected v2 services', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(
      release([{ resource_type: 'application', global_id: 42, version_id: 'app-live' }])
    )

    useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1', 'ds-2']),
      versionedResources: ref([
        { resourceType: 'application', resourceId: 42 },
        { resourceType: 'firewall', resourceId: 7 }
      ])
    })
    await flushPromises()

    // No raw HTTP request and no raw fetch: the composable reaches the backend
    // exclusively through the (mocked) v2 services.
    expect(httpSpy).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()

    // Confirm it DID go through the injected service seams instead.
    expect(deploymentService.useDeploymentsListQuery).toHaveBeenCalled()
    expect(deploymentReleaseService.getActiveReleaseComposition).toHaveBeenCalled()
  })
})

describe('useReleaseComposition - resolveConsumingDsIds (resource -> DS scan)', () => {
  // Each selected DS resolves to its own active release: ds-1 consumes the app
  // (global_id 42) + firewall 7; ds-2 consumes a different app; ds-3 has none.
  const wireReleases = () => {
    deploymentReleaseService.getActiveReleaseComposition.mockImplementation((dsId) => {
      if (dsId === 'ds-1') {
        return Promise.resolve(
          release([
            { resource_type: 'application', global_id: 42, version_id: 'app-live' },
            { resource_type: 'firewall', resource_id: 7, version_id: 'fw-live' }
          ])
        )
      }
      if (dsId === 'ds-2') {
        return Promise.resolve(
          release([{ resource_type: 'application', global_id: 99, version_id: 'app-other' }])
        )
      }
      return Promise.resolve(null)
    })
  }

  it('returns exactly the DS ids whose active release contains the (type,id) pair', async () => {
    wireReleases()
    const { resolveConsumingDsIds } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1', 'ds-2', 'ds-3']),
      versionedResources: ref([])
    })
    await flushPromises()

    // application keyed by global_id; only ds-1 holds app 42.
    expect(resolveConsumingDsIds('application', 42)).toEqual(['ds-1'])
    // ds-2 holds a different app; ds-3 holds nothing.
    expect(resolveConsumingDsIds('application', 99)).toEqual(['ds-2'])
  })

  it('matches non-application types by resource_id and ignores non-matching DS', async () => {
    wireReleases()
    const { resolveConsumingDsIds } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1', 'ds-2', 'ds-3']),
      versionedResources: ref([])
    })
    await flushPromises()

    // firewall keyed by resource_id; only ds-1 consumes firewall 7.
    expect(resolveConsumingDsIds('firewall', 7)).toEqual(['ds-1'])
    // A firewall id present in no release resolves to nothing (not fabricated).
    expect(resolveConsumingDsIds('firewall', 12345)).toEqual([])
    // Right id but wrong type must not match the application's global_id 42.
    expect(resolveConsumingDsIds('firewall', 42)).toEqual([])
  })

  it('coerces ids so a numeric pair matches a string id (and vice versa)', async () => {
    wireReleases()
    const { resolveConsumingDsIds } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([])
    })
    await flushPromises()

    expect(resolveConsumingDsIds('application', '42')).toEqual(['ds-1'])
    expect(resolveConsumingDsIds('firewall', '7')).toEqual(['ds-1'])
  })

  it('returns [] for a missing/invalid pair without scanning', async () => {
    wireReleases()
    const { resolveConsumingDsIds } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([])
    })
    await flushPromises()

    expect(resolveConsumingDsIds('application', null)).toEqual([])
    expect(resolveConsumingDsIds('application', undefined)).toEqual([])
    expect(resolveConsumingDsIds('', 42)).toEqual([])
  })
})

describe('useReleaseComposition - dependencyResourcesFor (inherited dep instances)', () => {
  // ds-1 pins one of each dependency type plus a singleton (firewall) that must
  // be ignored; the application is keyed by global_id and also ignored.
  const wireReleases = () => {
    deploymentReleaseService.getActiveReleaseComposition.mockImplementation((dsId) => {
      if (dsId === 'ds-1') {
        return Promise.resolve(
          release([
            { resource_type: 'application', global_id: 42, version_id: 'app-live' },
            { resource_type: 'firewall', resource_id: 7, version_id: 'fw-live' },
            { resource_type: 'function', resource_id: 'fn-1', version_id: 'fn-v3' },
            { resource_type: 'connector', resource_id: 'cn-9', version_id: 'cn-v1' },
            { resource_type: 'waf', resource_id: 'waf-2', version_id: 'waf-v5' },
            { resource_type: 'network_list', resource_id: 'nl-7', version_id: 'nl-v2' }
          ])
        )
      }
      return Promise.resolve(null)
    })
  }

  it('groups only the four dependency types, pinning each to its release version_id', async () => {
    wireReleases()
    const { dependencyResourcesFor } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([])
    })
    await flushPromises()

    expect(dependencyResourcesFor('ds-1')).toEqual({
      function: [{ resourceId: 'fn-1', version: 'fn-v3' }],
      connector: [{ resourceId: 'cn-9', version: 'cn-v1' }],
      waf: [{ resourceId: 'waf-2', version: 'waf-v5' }],
      network_list: [{ resourceId: 'nl-7', version: 'nl-v2' }]
    })
  })

  it('returns empty groups for a DS with no active release (never fabricated)', async () => {
    wireReleases()
    const { dependencyResourcesFor } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([])
    })
    await flushPromises()

    expect(dependencyResourcesFor('ds-unknown')).toEqual({
      function: [],
      connector: [],
      waf: [],
      network_list: []
    })
  })

  it('does not reach raw HTTP or fetch — pure read over the loaded release', async () => {
    wireReleases()
    const { dependencyResourcesFor } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1']),
      versionedResources: ref([])
    })
    await flushPromises()

    dependencyResourcesFor('ds-1')

    expect(httpSpy).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('useReleaseComposition - versionOptionsFor (registry toVersionOptions mapping)', () => {
  it('reflects the toVersionOptions mapping of the mocked registry', async () => {
    RESOURCE_CATALOG_REGISTRY.application.listVersions.mockResolvedValue([
      { id: 'app-ready', comment: 'Ready one', state: 'ready', isCurrent: true },
      { id: 'app-active', comment: 'Active one', state: 'active', isCurrent: false },
      { id: 'app-draft', comment: 'Draft one', state: 'draft', isCurrent: false }
    ])

    const { versionOptionsFor } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([{ resourceType: 'application', resourceId: 42 }])
    })
    await flushPromises()

    // Only deployable states (ready/active) survive; draft is dropped. Shape
    // and ordering come straight from `toVersionOptions`.
    expect(versionOptionsFor('application', 42)).toEqual([
      {
        label: 'Ready one',
        value: 'app-ready',
        createdAt: null,
        author: null,
        isCurrent: true
      },
      {
        label: 'Active one',
        value: 'app-active',
        createdAt: null,
        author: null,
        isCurrent: false
      }
    ])
    expect(RESOURCE_CATALOG_REGISTRY.application.listVersions).toHaveBeenCalledWith(42)
  })

  it('returns [] for a resource that has not been loaded', async () => {
    const { versionOptionsFor } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([])
    })
    await flushPromises()

    expect(versionOptionsFor('firewall', 7)).toEqual([])
  })

  it('maps versions independently per resource key', async () => {
    RESOURCE_CATALOG_REGISTRY.firewall.listVersions.mockResolvedValue([
      { id: 'fw-1', comment: '', state: 'ready', isCurrent: false }
    ])
    RESOURCE_CATALOG_REGISTRY.function.listVersions.mockResolvedValue([
      { id: 'fn-1', state: 'ready', lastEditor: 'alice', isCurrent: false }
    ])

    const { versionOptionsFor } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([
        { resourceType: 'firewall', resourceId: 7 },
        { resourceType: 'function', resourceId: 3 }
      ])
    })
    await flushPromises()

    // Empty comment falls back to the id for the label.
    expect(versionOptionsFor('firewall', 7)).toEqual([
      { label: 'fw-1', value: 'fw-1', createdAt: null, author: null, isCurrent: false }
    ])
    expect(versionOptionsFor('function', 3)).toEqual([
      { label: 'fn-1', value: 'fn-1', createdAt: null, author: 'alice', isCurrent: false }
    ])
  })
})

// ---------------------------------------------------------------------------
// Property 7 — buildAndActivate is the composable's dispatch seam (the layer
// allowed to call services, mirroring use-deploy-drawer.js `deploy()`). Multi-DS
// is N independent calls via Promise.allSettled, a per-DS settled outcome, and
// NO retry. The store hands over a PURE `composePayload()` (`{ resources, canary,
// canaryForm }`); the composable builds the strategy + adapter payload and fans
// it out. `DeploymentAdapter` and `buildStrategy` stay real (pure) so the genuine
// payload reaches the (mocked) service.
// ---------------------------------------------------------------------------
describe('useReleaseComposition - Property 7 (buildAndActivate fan-out, no retry)', () => {
  // A pure payload as `store.composePayload()` would produce it: a single,
  // already-resolved application resource and no canary strategy.
  const composedPayload = () => ({
    resources: [{ resource_id: 'app-1', resource_version: 'app-v1', resource_type: 'application' }],
    canary: false,
    canaryForm: {}
  })

  const mountComposable = () =>
    useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([])
    })

  it('issues exactly one call per selected DS, passing the same built payload', async () => {
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { ok: true } })
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-1', 'ds-2', 'ds-3'])

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(3)
    const calledIds = deploymentReleaseService.buildAndActivate.mock.calls.map(([id]) => id)
    expect(calledIds).toEqual(['ds-1', 'ds-2', 'ds-3'])

    // The DS-agnostic payload is built once: every call gets the SAME adapter
    // shape (resources keyed for deployment-api, application by global_id).
    const payloads = deploymentReleaseService.buildAndActivate.mock.calls.map(
      ([, payload]) => payload
    )
    const appRef = payloads[0].resources.find((ref) => ref.resource_type === 'application')
    expect(appRef.global_id).toBe('app-1')
    expect(appRef.version_id).toBe('app-v1')
    payloads.forEach((payload) => expect(payload).toEqual(payloads[0]))

    expect(results).toHaveLength(3)
    results.forEach((entry) => {
      expect(entry).toMatchObject({ ok: true, error: null, errorType: null })
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('value')
      expect(entry).toHaveProperty('traceId')
    })
  })

  it('returns a per-DS { id, ok, traceId, value, error, errorType } array mixing success and failure', async () => {
    const boom = new Error('422 versioned-urls limit')
    deploymentReleaseService.buildAndActivate.mockImplementation((id) =>
      id === 'ds-fail' ? Promise.reject(boom) : Promise.resolve({ data: { id } })
    )
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-ok', 'ds-fail', 'ds-ok-2'])

    expect(results).toEqual([
      {
        id: 'ds-ok',
        ok: true,
        traceId: null,
        value: { data: { id: 'ds-ok' } },
        error: null,
        errorType: null
      },
      { id: 'ds-fail', ok: false, traceId: null, value: null, error: boom, errorType: null },
      {
        id: 'ds-ok-2',
        ok: true,
        traceId: null,
        value: { data: { id: 'ds-ok-2' } },
        error: null,
        errorType: null
      }
    ])
  })

  it('collects the async trace_id per DS from a 202 build_and_activate body (req 5.2/11.1)', async () => {
    // The service returns `{ data }` with the raw 202 body; trace_id may sit at
    // the top level or one level under `data` depending on API wrapping.
    deploymentReleaseService.buildAndActivate.mockImplementation((id) =>
      id === 'ds-wrapped'
        ? Promise.resolve({ data: { data: { trace_id: `trace-${id}` } } })
        : Promise.resolve({ data: { trace_id: `trace-${id}` } })
    )
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-flat', 'ds-wrapped'])

    expect(results.map((entry) => ({ id: entry.id, traceId: entry.traceId }))).toEqual([
      { id: 'ds-flat', traceId: 'trace-ds-flat' },
      { id: 'ds-wrapped', traceId: 'trace-ds-wrapped' }
    ])
  })

  it('maps the versioned-URLs active limit (422 43007) to a typed errorType (req 5.5/7.2)', async () => {
    // The versioned-URLs active limit barrier: the service throws the v2
    // ErrorHandler-shaped rejection carrying the API error code; the raw axios
    // shape is also recognised. NO pre-block, NO active-count — we trust the 422.
    const errorHandlerShaped = {
      status: 422,
      message: ['Versioned URLs active limit reached'],
      response: { data: { errors: [{ code: VERSIONED_URLS_ACTIVE_LIMIT_CODE }] } }
    }
    const axiosShaped = {
      response: { status: 422, data: { errors: [{ code: VERSIONED_URLS_ACTIVE_LIMIT_CODE }] } }
    }
    const otherFailure = { status: 500, message: ['Boom'] }

    deploymentReleaseService.buildAndActivate.mockImplementation((id) => {
      if (id === 'ds-handler') return Promise.reject(errorHandlerShaped)
      if (id === 'ds-axios') return Promise.reject(axiosShaped)
      if (id === 'ds-500') return Promise.reject(otherFailure)
      return Promise.resolve({ data: { trace_id: `trace-${id}` } })
    })

    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), [
      'ds-handler',
      'ds-axios',
      'ds-500',
      'ds-ok'
    ])

    const byId = Object.fromEntries(results.map((entry) => [entry.id, entry]))
    expect(byId['ds-handler'].errorType).toBe(
      BUILD_AND_ACTIVATE_ERROR_TYPES.VERSIONED_URLS_ACTIVE_LIMIT
    )
    expect(byId['ds-axios'].errorType).toBe(
      BUILD_AND_ACTIVATE_ERROR_TYPES.VERSIONED_URLS_ACTIVE_LIMIT
    )
    // A non-limit failure stays untyped (still surfaced via `error`); no retry.
    expect(byId['ds-500'].errorType).toBeNull()
    expect(byId['ds-500'].error).toBe(otherFailure)
    expect(byId['ds-ok']).toMatchObject({ ok: true, errorType: null, traceId: 'trace-ds-ok' })
  })

  it('does not type a generic 422 lacking the 43007 code (no active-count assumed)', async () => {
    const plain422 = { status: 422, message: ['Some other validation error'] }
    deploymentReleaseService.buildAndActivate.mockRejectedValue(plain422)
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const [result] = await buildAndActivate(composedPayload(), ['ds-1'])

    expect(result.ok).toBe(false)
    expect(result.errorType).toBeNull()
    expect(result.error).toBe(plain422)
  })

  it('does NOT retry a rejected DS (one call total for the failing id)', async () => {
    deploymentReleaseService.buildAndActivate.mockRejectedValue(new Error('boom'))
    const { buildAndActivate, isDeploying } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-fail'])

    // The failure surfaces once; the composable never re-invokes the service.
    const failCalls = deploymentReleaseService.buildAndActivate.mock.calls.filter(
      ([id]) => id === 'ds-fail'
    )
    expect(failCalls).toHaveLength(1)
    expect(results).toHaveLength(1)
    expect(results[0].ok).toBe(false)

    // isDeploying is reset even after rejection (finally block).
    expect(isDeploying.value).toBe(false)
  })

  it('returns [] and calls nothing when no DS id is supplied', async () => {
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    expect(await buildAndActivate(composedPayload(), [])).toEqual([])
    expect(deploymentReleaseService.buildAndActivate).not.toHaveBeenCalled()
  })

  it('builds the canary strategy when the payload enables it', async () => {
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { ok: true } })
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    await buildAndActivate(
      {
        resources: [
          { resource_id: 'app-1', resource_version: 'app-v1', resource_type: 'application' }
        ],
        canary: true,
        canaryForm: { rollout_mode: 'gradual', gradual_rollout_candidate_percentage: 10 }
      },
      ['ds-1']
    )

    const [, payload] = deploymentReleaseService.buildAndActivate.mock.calls[0]
    // The real buildStrategy + adapter produced a strategy block from the form.
    expect(payload.strategy).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Property 8 (scoped publish) — buildAndActivate's PER-DS singleton reconcile.
// In a scoped (Scenario B) entry the store hands over `{ scoped: true, override:
// { resource_type, resource_id, version } }`. The scoped resource is a SINGLETON
// (application/firewall/custom_page). The composable builds a SEPARATE body per
// selected DS from that DS's OWN active composition and reconciles the scoped
// singleton against it:
//   - same type + same id (matchesOverride) → preserve every field, swap only
//     `version_id` (unchanged swap behaviour, other resources carried byte-for-byte);
//   - same type but a DIFFERENT id → replace the whole entry with the scoped
//     `{ resource_id, resource_type, version_id }` (flexible swap);
//   - no resource of that type → ADD the scoped entry (create/link).
// DEGRADED excludes a DS ONLY when reading its active release actually FAILS
// (`getActiveReleaseComposition` rejects). A DS whose read resolves `null` (no
// release) is NOT degraded — it is the CREATE path. MISMATCH survives in the
// enum for back-compat but is never produced.
// `DeploymentAdapter` stays real so the genuine deployment-api body is asserted.
// ---------------------------------------------------------------------------
describe('useReleaseComposition - Property 8 (scoped publish: per-DS singleton reconcile)', () => {
  // ds-keep holds the scoped application (global_id 42) plus other resources that
  // must survive untouched; ds-other holds a different app (flexible swap); ds-gone
  // has no active release (create path).
  const wireScopedReleases = () => {
    deploymentReleaseService.getActiveReleaseComposition.mockImplementation((dsId) => {
      if (dsId === 'ds-keep') {
        return Promise.resolve(
          release([
            { resource_type: 'application', global_id: 42, version_id: 'app-old' },
            { resource_type: 'firewall', resource_id: 7, version_id: 'fw-keep' },
            { resource_type: 'function', resource_id: 'fn-1', version_id: 'fn-keep' }
          ])
        )
      }
      if (dsId === 'ds-other') {
        return Promise.resolve(
          release([{ resource_type: 'application', global_id: 99, version_id: 'other-app' }])
        )
      }
      return Promise.resolve(null)
    })
  }

  const scopedAppOverride = () => ({
    scoped: true,
    override: { resource_type: 'application', resource_id: 42, version: 'app-new' },
    canary: false,
    canaryForm: {}
  })

  it('swaps ONLY the scoped resource version and preserves every other resource byte-for-byte', async () => {
    wireScopedReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-keep']),
      versionedResources: ref([])
    })
    await flushPromises()

    const results = await buildAndActivate(scopedAppOverride(), ['ds-keep'])

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(1)
    const [calledId, payload] = deploymentReleaseService.buildAndActivate.mock.calls[0]
    expect(calledId).toBe('ds-keep')

    // The application is keyed by global_id (adapter contract) and ONLY its version
    // changed to the override; firewall + function keep their pinned versions.
    const byType = Object.fromEntries(
      payload.resources.map((resource) => [resource.resource_type, resource])
    )
    expect(byType.application).toEqual({
      global_id: 42,
      version_id: 'app-new',
      resource_type: 'application'
    })
    expect(byType.firewall).toEqual({
      resource_id: 7,
      version_id: 'fw-keep',
      resource_type: 'firewall'
    })
    expect(byType.function).toEqual({
      resource_id: 'fn-1',
      version_id: 'fn-keep',
      resource_type: 'function'
    })

    expect(results[0]).toMatchObject({ id: 'ds-keep', ok: true })
  })

  it('matches the scoped application by global_id (not resource_id)', async () => {
    wireScopedReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-keep']),
      versionedResources: ref([])
    })
    await flushPromises()

    // The override id is the application's global_id; the swap must land on it.
    await buildAndActivate(scopedAppOverride(), ['ds-keep'])
    const [, payload] = deploymentReleaseService.buildAndActivate.mock.calls[0]
    const appRef = payload.resources.find((resource) => resource.resource_type === 'application')
    expect(appRef.global_id).toBe(42)
    expect(appRef.version_id).toBe('app-new')
  })

  it('SWAPS the scoped singleton onto a DS holding a different resource of the same type', async () => {
    wireScopedReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-other']),
      versionedResources: ref([])
    })
    await flushPromises()

    // ds-other holds app 99 (a different application). The scoped singleton
    // replaces it wholesale — the DS ends up with the scoped app 42 and no
    // duplicate application entry.
    const results = await buildAndActivate(scopedAppOverride(), ['ds-other'])

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(1)
    const [calledId, payload] = deploymentReleaseService.buildAndActivate.mock.calls[0]
    expect(calledId).toBe('ds-other')

    expect(
      payload.resources.filter((resource) => resource.resource_type === 'application')
    ).toEqual([{ global_id: 42, version_id: 'app-new', resource_type: 'application' }])

    expect(results[0]).toMatchObject({ id: 'ds-other', ok: true })
  })

  it('ADDS the scoped resource (creates a release) when the DS has no active composition', async () => {
    wireScopedReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-gone']),
      versionedResources: ref([])
    })
    await flushPromises()

    // ds-gone resolves `null` (no release) → the scoped singleton is ADDED,
    // creating a fresh composition instead of being skipped.
    const results = await buildAndActivate(scopedAppOverride(), ['ds-gone'])

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(1)
    const [calledId, payload] = deploymentReleaseService.buildAndActivate.mock.calls[0]
    expect(calledId).toBe('ds-gone')
    expect(payload.resources).toEqual([
      { global_id: 42, version_id: 'app-new', resource_type: 'application' }
    ])

    expect(results[0]).toMatchObject({ id: 'ds-gone', ok: true })
  })

  it('EXCLUDES a DEGRADED DS whose active release cannot be READ', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockRejectedValue(new Error('read failed'))
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-fail-read']),
      versionedResources: ref([])
    })
    await flushPromises()

    // The read genuinely rejects → the DS is DEGRADED and excluded; nothing is
    // published and no body is borrowed from another DS.
    const results = await buildAndActivate(scopedAppOverride(), ['ds-fail-read'])

    expect(deploymentReleaseService.buildAndActivate).not.toHaveBeenCalled()
    expect(results).toEqual([
      {
        id: 'ds-fail-read',
        ok: false,
        skipped: true,
        skipReason: SCOPED_PUBLISH_SKIP_REASONS.DEGRADED,
        traceId: null,
        value: null,
        error: null,
        errorType: null
      }
    ])
  })

  it('fans out per-DS: swap-same, swap-different and create all publish their OWN body', async () => {
    wireScopedReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-keep', 'ds-other', 'ds-gone']),
      versionedResources: ref([])
    })
    await flushPromises()

    const results = await buildAndActivate(scopedAppOverride(), ['ds-keep', 'ds-other', 'ds-gone'])

    // ds-keep swaps the same app, ds-other swaps a different app, ds-gone creates:
    // all three publish their own body.
    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(3)
    const calledIds = deploymentReleaseService.buildAndActivate.mock.calls.map(([id]) => id)
    expect(calledIds).toContain('ds-keep')
    expect(calledIds).toContain('ds-other')
    expect(calledIds).toContain('ds-gone')

    // Results preserve the caller's id order with per-DS outcome.
    expect(results.map((entry) => ({ id: entry.id, ok: entry.ok }))).toEqual([
      { id: 'ds-keep', ok: true },
      { id: 'ds-other', ok: true },
      { id: 'ds-gone', ok: true }
    ])
  })

  it('never POSTs version_id:null — a null/undefined override version is a hard UNRESOLVED_VERSION error (Issue 3)', async () => {
    // The store resolves the LATEST sentinel in composePayload(), but when the
    // scoped resource's versions were never loaded that resolution yields null.
    // The composable must NEVER dispatch `version_id: null` (the API rejects it):
    // every target DS is surfaced as a hard UNRESOLVED_VERSION error instead.
    wireScopedReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-keep']),
      versionedResources: ref([])
    })
    await flushPromises()

    const nullVersionOverride = {
      scoped: true,
      override: { resource_type: 'application', resource_id: 42, version: null },
      canary: false,
      canaryForm: {}
    }
    const results = await buildAndActivate(nullVersionOverride, ['ds-keep'])

    // No publish was issued — a null pin never left the composable.
    expect(deploymentReleaseService.buildAndActivate).not.toHaveBeenCalled()
    expect(results).toEqual([
      {
        id: 'ds-keep',
        ok: false,
        skipped: true,
        skipReason: SCOPED_PUBLISH_SKIP_REASONS.UNRESOLVED_VERSION,
        traceId: null,
        value: null,
        error: null,
        errorType: null
      }
    ])
  })

  it('reads the active composition on demand when it was not pre-loaded (req 2.1)', async () => {
    // No selectedDsIds, so the watcher never pre-loads — buildAndActivate must
    // fetch the composition itself for the target DS.
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(
      release([{ resource_type: 'application', global_id: 42, version_id: 'app-old' }])
    )
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([])
    })
    await flushPromises()

    const results = await buildAndActivate(scopedAppOverride(), ['ds-lazy'])

    expect(deploymentReleaseService.getActiveReleaseComposition).toHaveBeenCalledWith('ds-lazy')
    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(1)
    expect(results[0]).toMatchObject({ id: 'ds-lazy', ok: true })
  })
})

describe('useReleaseComposition - Property 6 (scoped publish: per-DS dependency-version injection)', () => {
  const findByType = (payload, type) =>
    payload.resources.find((resource) => resource.resource_type === type)

  const findById = (payload, type, resourceId) =>
    payload.resources.find(
      (resource) =>
        resource.resource_type === type && String(resource.resource_id) === String(resourceId)
    )

  const findFunctionById = (payload, resourceId) => findById(payload, 'function', resourceId)
  const findConnectorById = (payload, resourceId) => findById(payload, 'connector', resourceId)

  const lastPayloadFor = (dsId) => {
    const call = deploymentReleaseService.buildAndActivate.mock.calls.find(([id]) => id === dsId)
    return call?.[1]
  }

  // ds-with-fn already pins function fn-1 plus a connector that must survive untouched;
  // ds-no-fn has the scoped application but NO function, so the override is INSERTED.
  const wireFunctionReleases = () => {
    deploymentReleaseService.getActiveReleaseComposition.mockImplementation((dsId) => {
      if (dsId === 'ds-with-fn') {
        return Promise.resolve(
          release([
            { resource_type: 'application', global_id: 42, version_id: 'app-old' },
            { resource_type: 'connector', resource_id: 'conn-1', version_id: 'conn-keep' },
            { resource_type: 'function', resource_id: 'fn-1', version_id: 'fn-old' }
          ])
        )
      }
      if (dsId === 'ds-no-fn') {
        return Promise.resolve(
          release([
            { resource_type: 'application', global_id: 42, version_id: 'app-old' },
            { resource_type: 'connector', resource_id: 'conn-9', version_id: 'conn-keep-9' }
          ])
        )
      }
      return Promise.resolve(null)
    })
  }

  const scopedPayload = (dependencyOverrides) => ({
    scoped: true,
    override: { resource_type: 'application', resource_id: 42, version: 'app-new' },
    dependencyOverrides,
    canary: false,
    canaryForm: {}
  })

  const mountFor = (ids) => {
    const composable = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(ids),
      versionedResources: ref([])
    })
    return composable
  }

  it('OVERRIDES the version_id of a matching function and swaps the application, preserving the connector byte-for-byte', async () => {
    wireFunctionReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = mountFor(['ds-with-fn'])
    await flushPromises()

    const results = await buildAndActivate(
      scopedPayload([{ resource_id: 'fn-1', resource_type: 'function', version: 'fn-new' }]),
      ['ds-with-fn']
    )

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(1)
    const payload = lastPayloadFor('ds-with-fn')

    expect(findByType(payload, 'application')).toEqual({
      global_id: 42,
      version_id: 'app-new',
      resource_type: 'application'
    })
    expect(findFunctionById(payload, 'fn-1')).toEqual({
      resource_id: 'fn-1',
      version_id: 'fn-new',
      resource_type: 'function'
    })
    expect(findByType(payload, 'connector')).toEqual({
      resource_id: 'conn-1',
      version_id: 'conn-keep',
      resource_type: 'connector'
    })
    expect(
      payload.resources.filter((resource) => resource.resource_type === 'function')
    ).toHaveLength(1)

    expect(results[0]).toMatchObject({ id: 'ds-with-fn', ok: true })
  })

  it('INSERTS the function as { resource_id, resource_type: function, version_id } when the active release does not contain it', async () => {
    wireFunctionReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = mountFor(['ds-no-fn'])
    await flushPromises()

    const results = await buildAndActivate(
      scopedPayload([{ resource_id: 'fn-7', resource_type: 'function', version: 'fn-fresh' }]),
      ['ds-no-fn']
    )

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(1)
    const payload = lastPayloadFor('ds-no-fn')

    expect(findFunctionById(payload, 'fn-7')).toEqual({
      resource_id: 'fn-7',
      version_id: 'fn-fresh',
      resource_type: 'function'
    })
    expect(findByType(payload, 'application')).toEqual({
      global_id: 42,
      version_id: 'app-new',
      resource_type: 'application'
    })
    expect(findByType(payload, 'connector')).toEqual({
      resource_id: 'conn-9',
      version_id: 'conn-keep-9',
      resource_type: 'connector'
    })

    expect(results[0]).toMatchObject({ id: 'ds-no-fn', ok: true })
  })

  it('NULL SAFETY: a function dependencyOverride with null version is never POSTed as version_id:null', async () => {
    wireFunctionReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = mountFor(['ds-with-fn'])
    await flushPromises()

    await buildAndActivate(
      scopedPayload([{ resource_id: 'fn-1', resource_type: 'function', version: null }]),
      ['ds-with-fn']
    )

    const payload = lastPayloadFor('ds-with-fn')

    const fnRef = findFunctionById(payload, 'fn-1')
    expect(fnRef.version_id).toBe('fn-old')
    expect(fnRef.version_id).not.toBeNull()
    expect(payload.resources.some((resource) => resource.version_id === null)).toBe(false)
  })

  it('applies MULTIPLE function dependencyOverrides per DS (override + insert in the same body)', async () => {
    wireFunctionReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = mountFor(['ds-with-fn'])
    await flushPromises()

    await buildAndActivate(
      scopedPayload([
        { resource_id: 'fn-1', resource_type: 'function', version: 'fn-new' },
        { resource_id: 'fn-2', resource_type: 'function', version: 'fn-2-new' }
      ]),
      ['ds-with-fn']
    )

    const payload = lastPayloadFor('ds-with-fn')

    expect(findFunctionById(payload, 'fn-1')).toEqual({
      resource_id: 'fn-1',
      version_id: 'fn-new',
      resource_type: 'function'
    })
    expect(findFunctionById(payload, 'fn-2')).toEqual({
      resource_id: 'fn-2',
      version_id: 'fn-2-new',
      resource_type: 'function'
    })
    expect(
      payload.resources.filter((resource) => resource.resource_type === 'function')
    ).toHaveLength(2)
  })

  it('OVERRIDES the version_id of a matching connector and swaps the application, preserving the function byte-for-byte', async () => {
    wireFunctionReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = mountFor(['ds-with-fn'])
    await flushPromises()

    const results = await buildAndActivate(
      scopedPayload([{ resource_id: 'conn-1', resource_type: 'connector', version: 'conn-new' }]),
      ['ds-with-fn']
    )

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(1)
    const payload = lastPayloadFor('ds-with-fn')

    expect(findByType(payload, 'application')).toEqual({
      global_id: 42,
      version_id: 'app-new',
      resource_type: 'application'
    })
    expect(findConnectorById(payload, 'conn-1')).toEqual({
      resource_id: 'conn-1',
      version_id: 'conn-new',
      resource_type: 'connector'
    })
    expect(findFunctionById(payload, 'fn-1')).toEqual({
      resource_id: 'fn-1',
      version_id: 'fn-old',
      resource_type: 'function'
    })
    expect(
      payload.resources.filter((resource) => resource.resource_type === 'connector')
    ).toHaveLength(1)

    expect(results[0]).toMatchObject({ id: 'ds-with-fn', ok: true })
  })

  it('INSERTS the connector as { resource_id, resource_type: connector, version_id } when the active release does not contain it', async () => {
    wireFunctionReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = mountFor(['ds-no-fn'])
    await flushPromises()

    const results = await buildAndActivate(
      scopedPayload([
        { resource_id: 'conn-77', resource_type: 'connector', version: 'conn-fresh' }
      ]),
      ['ds-no-fn']
    )

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(1)
    const payload = lastPayloadFor('ds-no-fn')

    expect(findConnectorById(payload, 'conn-77')).toEqual({
      resource_id: 'conn-77',
      version_id: 'conn-fresh',
      resource_type: 'connector'
    })
    expect(findByType(payload, 'application')).toEqual({
      global_id: 42,
      version_id: 'app-new',
      resource_type: 'application'
    })
    // The pre-existing connector conn-9 (a different id) survives untouched.
    expect(findConnectorById(payload, 'conn-9')).toEqual({
      resource_id: 'conn-9',
      version_id: 'conn-keep-9',
      resource_type: 'connector'
    })

    expect(results[0]).toMatchObject({ id: 'ds-no-fn', ok: true })
  })

  it('applies a MIXED function + connector dependencyOverride set in one body', async () => {
    wireFunctionReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = mountFor(['ds-with-fn'])
    await flushPromises()

    await buildAndActivate(
      scopedPayload([
        { resource_id: 'fn-1', resource_type: 'function', version: 'fn-new' },
        { resource_id: 'conn-1', resource_type: 'connector', version: 'conn-new' }
      ]),
      ['ds-with-fn']
    )

    const payload = lastPayloadFor('ds-with-fn')

    expect(findByType(payload, 'application')).toEqual({
      global_id: 42,
      version_id: 'app-new',
      resource_type: 'application'
    })
    expect(findFunctionById(payload, 'fn-1')).toEqual({
      resource_id: 'fn-1',
      version_id: 'fn-new',
      resource_type: 'function'
    })
    expect(findConnectorById(payload, 'conn-1')).toEqual({
      resource_id: 'conn-1',
      version_id: 'conn-new',
      resource_type: 'connector'
    })
    expect(
      payload.resources.filter((resource) => resource.resource_type === 'function')
    ).toHaveLength(1)
    expect(
      payload.resources.filter((resource) => resource.resource_type === 'connector')
    ).toHaveLength(1)
  })

  it('NULL SAFETY: a connector dependencyOverride with null version is never POSTed as version_id:null', async () => {
    wireFunctionReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = mountFor(['ds-with-fn'])
    await flushPromises()

    await buildAndActivate(
      scopedPayload([{ resource_id: 'conn-1', resource_type: 'connector', version: null }]),
      ['ds-with-fn']
    )

    const payload = lastPayloadFor('ds-with-fn')

    const connRef = findConnectorById(payload, 'conn-1')
    expect(connRef.version_id).toBe('conn-keep')
    expect(connRef.version_id).not.toBeNull()
    expect(payload.resources.some((resource) => resource.version_id === null)).toBe(false)
  })

  it('a DS with no composition now CREATES a release with the scoped app and the dependency override', async () => {
    wireFunctionReleases()
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 't' } })

    const { buildAndActivate } = mountFor(['ds-with-fn', 'ds-gone'])
    await flushPromises()

    const results = await buildAndActivate(
      scopedPayload([{ resource_id: 'fn-9', resource_type: 'function', version: 'fn-9-new' }]),
      ['ds-with-fn', 'ds-gone']
    )

    // Both DSs publish: ds-with-fn reconciles its existing composition, while
    // ds-gone (no release) CREATES one carrying the scoped app plus the dependency
    // override.
    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(2)

    const gonePayload = lastPayloadFor('ds-gone')
    expect(findByType(gonePayload, 'application')).toEqual({
      global_id: 42,
      version_id: 'app-new',
      resource_type: 'application'
    })
    expect(findFunctionById(gonePayload, 'fn-9')).toEqual({
      resource_id: 'fn-9',
      version_id: 'fn-9-new',
      resource_type: 'function'
    })

    expect(results.map((entry) => ({ id: entry.id, ok: entry.ok }))).toEqual([
      { id: 'ds-with-fn', ok: true },
      { id: 'ds-gone', ok: true }
    ])
  })
})
