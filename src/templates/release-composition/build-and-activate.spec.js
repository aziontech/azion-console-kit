/**
 * Integration test for the write path inside `useReleaseComposition`
 * (spec task 10.3, Property 7).
 *
 * Property 7 — `build_and_activate` is fan-out per DS, `Promise.allSettled`,
 *   NO auto-retry, and the versioned-URLs active limit (`422 43007`) is mapped:
 *
 *     Given a composed payload and a 1..N selection of Deployment Settings,
 *     `buildAndActivate()` issues exactly one independent
 *     `deploymentReleaseService.buildAndActivate(dsId, payload)` per DS (req 5.1),
 *     settles them with `Promise.allSettled` so a partial failure never aborts
 *     its siblings (req 5.3), re-invokes nothing on rejection (no auto-retry,
 *     req 5.3), and maps the `422 43007` rejection to the typed
 *     `versioned_urls_active_limit` error rather than pre-blocking (req 5.5/7.2).
 *
 * Validates requirements 5.1, 5.3, 5.5.
 *
 * This is an INTEGRATION test (not a unit/PBT): it drives the composable's
 * public `buildAndActivate` end-to-end through the REAL `DeploymentAdapter` and
 * `buildStrategy` (pure transforms), so the genuine deployment-api payload
 * reaches the service. Only the IO seam is mocked —
 * `deploymentReleaseService.buildAndActivate` is the single write boundary; the
 * read seams (`useDeploymentsListQuery`, `getActiveReleaseComposition`) are
 * stubbed inert so the composable is constructible without touching the network.
 * `httpService.request` and the global `fetch` are spied to prove no raw IO path
 * is exercised behind the mocked service.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'

// Read seams fire at composable setup (`useDeploymentsListQuery`) and from the
// `selectedDsIds` watcher (`getActiveReleaseComposition`). Stub both so the
// write path under test runs in isolation, with no network and no s2s path.
vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: { useDeploymentsListQuery: vi.fn() }
}))
vi.mock('@/services/v2/deployment/deployment-release-service', () => ({
  deploymentReleaseService: { getActiveReleaseComposition: vi.fn(), buildAndActivate: vi.fn() }
}))
// No resource is versioned in these fixtures, so an empty registry keeps the
// version watcher inert (no IO, no options loaded).
vi.mock('@/services/v2/deployment/resource-catalog-registry', () => ({
  RESOURCE_CATALOG_REGISTRY: {}
}))

import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
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

// A pure payload as `store.composePayload()` would produce it: a single
// already-resolved application resource (no canary). The composable feeds this
// through the real adapter to build the DS-agnostic deployment-api payload.
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

let httpSpy
let fetchSpy

beforeEach(() => {
  deploymentService.useDeploymentsListQuery.mockReturnValue(queryStub([]))
  deploymentReleaseService.getActiveReleaseComposition.mockResolvedValue(null)
  deploymentReleaseService.buildAndActivate.mockReset()

  // Any raw HTTP or fetch attempt would have to go through one of these two;
  // spying lets the suite assert the write never bypasses the injected service.
  httpSpy = vi.spyOn(httpService, 'request').mockResolvedValue({ data: {} })
  fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('build_and_activate write path — Property 7 (integration)', () => {
  it('fans out exactly one independent service call per selected DS (req 5.1)', async () => {
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 'trace' } })
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-1', 'ds-2', 'ds-3'])

    // One POST per deployment_id, in selection order, never bundled.
    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(3)
    expect(deploymentReleaseService.buildAndActivate.mock.calls.map(([id]) => id)).toEqual([
      'ds-1',
      'ds-2',
      'ds-3'
    ])
    expect(results).toHaveLength(3)

    // Reached the backend exclusively through the injected service — no raw IO
    // and no service-to-service path (req 10.2).
    expect(httpSpy).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('builds the DS-agnostic deployment-api payload once via the real adapter', async () => {
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 'trace' } })
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    await buildAndActivate(composedPayload(), ['ds-1', 'ds-2'])

    const payloads = deploymentReleaseService.buildAndActivate.mock.calls.map(
      ([, payload]) => payload
    )
    // The application is keyed by `global_id`, the version pinned in `version_id`
    // (deployment-api schema), produced by the real `DeploymentAdapter`.
    const appRef = payloads[0].resources.find((entry) => entry.resource_type === 'application')
    expect(appRef.global_id).toBe('app-1')
    expect(appRef.version_id).toBe('app-v1')
    // Every DS receives the identical built payload (resources are DS-agnostic).
    payloads.forEach((payload) => expect(payload).toEqual(payloads[0]))
  })

  it('settles all DS with Promise.allSettled — a partial failure never aborts siblings (req 5.3)', async () => {
    // The middle DS rejects; the first and the LATER one must still complete and
    // report their own outcome (proof the fan-out is settled, not short-circuited).
    const boom = new Error('build_and_activate failed for ds-fail')
    deploymentReleaseService.buildAndActivate.mockImplementation((id) =>
      id === 'ds-fail'
        ? Promise.reject(boom)
        : Promise.resolve({ data: { trace_id: `trace-${id}` } })
    )
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-ok', 'ds-fail', 'ds-after'])

    // Positional, per-DS settled outcome — the rejection is isolated to its DS.
    expect(results.map((entry) => ({ id: entry.id, ok: entry.ok }))).toEqual([
      { id: 'ds-ok', ok: true },
      { id: 'ds-fail', ok: false },
      { id: 'ds-after', ok: true }
    ])
    // The DS after the failure still ran and carried its own trace_id (req 11.1):
    // the failure did not abort the batch.
    const after = results.find((entry) => entry.id === 'ds-after')
    expect(after.traceId).toBe('trace-ds-after')
    expect(after.error).toBeNull()
    // The failing DS surfaces its raw error and no trace id.
    const failed = results.find((entry) => entry.id === 'ds-fail')
    expect(failed.error).toBe(boom)
    expect(failed.traceId).toBeNull()
  })

  it('does NOT auto-retry a rejected DS — exactly one call for the failing id (req 5.3)', async () => {
    deploymentReleaseService.buildAndActivate.mockRejectedValue(new Error('persistent failure'))
    const { buildAndActivate, isDeploying } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-fail'])

    // The service is invoked once and never re-invoked on rejection.
    expect(
      deploymentReleaseService.buildAndActivate.mock.calls.filter(([id]) => id === 'ds-fail')
    ).toHaveLength(1)
    expect(results).toHaveLength(1)
    expect(results[0].ok).toBe(false)
    // `isDeploying` is reset even after rejection (the `finally` block).
    expect(isDeploying.value).toBe(false)
  })

  it('maps the versioned-URLs active limit (422 43007) to a typed errorType (req 5.5)', async () => {
    // The barrier for the versioned-URLs limit is the publish API's `422 43007`
    // (req 5.5/7.2): we let the request go and map ONLY this signature to a typed
    // error — across both the v2 ErrorHandler shape and a raw axios shape.
    const errorHandlerShaped = {
      status: 422,
      message: ['Versioned URLs active limit reached'],
      response: { data: { errors: [{ code: VERSIONED_URLS_ACTIVE_LIMIT_CODE }] } }
    }
    const axiosShaped = {
      response: { status: 422, data: { errors: [{ code: VERSIONED_URLS_ACTIVE_LIMIT_CODE }] } }
    }

    deploymentReleaseService.buildAndActivate.mockImplementation((id) => {
      if (id === 'ds-handler') return Promise.reject(errorHandlerShaped)
      if (id === 'ds-axios') return Promise.reject(axiosShaped)
      return Promise.resolve({ data: { trace_id: `trace-${id}` } })
    })
    const { buildAndActivate, buildAndActivateErrorTypes } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-handler', 'ds-axios', 'ds-ok'])
    const byId = Object.fromEntries(results.map((entry) => [entry.id, entry]))

    expect(byId['ds-handler'].errorType).toBe(
      BUILD_AND_ACTIVATE_ERROR_TYPES.VERSIONED_URLS_ACTIVE_LIMIT
    )
    expect(byId['ds-axios'].errorType).toBe(
      BUILD_AND_ACTIVATE_ERROR_TYPES.VERSIONED_URLS_ACTIVE_LIMIT
    )
    // The typed catalog is re-exported so the consumer matches without re-encoding
    // the magic code — the composable's export equals the module constant.
    expect(buildAndActivateErrorTypes).toBe(BUILD_AND_ACTIVATE_ERROR_TYPES)
    // The succeeding DS is unaffected and carries its async trace_id.
    expect(byId['ds-ok']).toMatchObject({ ok: true, errorType: null, traceId: 'trace-ds-ok' })
  })

  it('does NOT type a generic 422 lacking the 43007 code (no active-count assumed, req 7.2)', async () => {
    // A 422 without `43007` is just a validation error: surfaced via `error`,
    // never typed as the versioned-URLs limit (the limit is trusted, not computed).
    const plain422 = { status: 422, message: ['Some other validation error'] }
    deploymentReleaseService.buildAndActivate.mockRejectedValue(plain422)
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const [result] = await buildAndActivate(composedPayload(), ['ds-1'])

    expect(result.ok).toBe(false)
    expect(result.errorType).toBeNull()
    expect(result.error).toBe(plain422)
  })

  it('returns [] and issues no call when the selection is empty', async () => {
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    expect(await buildAndActivate(composedPayload(), [])).toEqual([])
    expect(deploymentReleaseService.buildAndActivate).not.toHaveBeenCalled()
  })

  it('builds the canary strategy through the real strategy-builder when enabled', async () => {
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 'trace' } })
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
    // The real `buildStrategy` + adapter produced a strategy block from the form.
    expect(payload.strategy).toBeTruthy()
  })
})
