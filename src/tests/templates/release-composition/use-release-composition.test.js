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
  VERSIONED_URLS_ACTIVE_LIMIT_CODE
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
  it('empty state: no DS selected => impact available-but-empty, no rows, null totals', async () => {
    const { impact, impactUnavailable } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref([]),
      versionedResources: ref([])
    })
    await flushPromises()

    // req 7.1: nothing selected is "no impact to preview", NOT "unavailable".
    expect(impactUnavailable.value).toBe(false)
    expect(impact.value.hasSelection).toBe(false)
    expect(impact.value.perDs).toEqual([])
    expect(impact.value.totals).toBeNull()
  })

  it('degraded state: DS selected but no reverse-lookup => unavailable, zero rows, null totals', async () => {
    deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(
      release([{ resource_type: 'application', global_id: 42, version_id: 'app-live' }])
    )

    const { impact, impactUnavailable } = useReleaseComposition({
      enabled: ref(true),
      selectedDsIds: ref(['ds-1', 'ds-2']),
      versionedResources: ref([])
    })
    await flushPromises()

    // No browser-reachable reverse-lookup source exists today, so the impact
    // degrades. Nothing synthetic may be produced: zero rows, null totals.
    expect(impactUnavailable.value).toBe(true)
    expect(impact.value.hasSelection).toBe(true)
    expect(impact.value.perDs).toEqual([])
    expect(impact.value.perDs).toHaveLength(0)
    expect(impact.value.totals).toBeNull()
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
    // blast-radius data — impact must stay strictly empty, not derived.
    expect(impact.value).toEqual({
      hasSelection: true,
      impactUnavailable: true,
      perDs: [],
      totals: null
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
    expect(impact.value.totals).toBeNull()
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
      { id: 'fn-1', state: 'active', lastEditor: 'alice', isCurrent: false }
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
