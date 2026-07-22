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

vi.mock('@/services/v2/deployment/deployment-service', () => ({
  deploymentService: { useDeploymentsListQuery: vi.fn() }
}))
vi.mock('@/services/v2/deployment/deployment-release-service', () => ({
  deploymentReleaseService: { getActiveReleaseComposition: vi.fn(), buildAndActivate: vi.fn() }
}))
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

const queryStub = (body = []) => ({
  data: ref({ body }),
  isLoading: ref(false),
  isError: ref(false),
  refetch: vi.fn()
})

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

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(3)
    expect(deploymentReleaseService.buildAndActivate.mock.calls.map(([id]) => id)).toEqual([
      'ds-1',
      'ds-2',
      'ds-3'
    ])
    expect(results).toHaveLength(3)

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
    const appRef = payloads[0].resources.find((entry) => entry.resource_type === 'application')
    expect(appRef.resource_id).toBe('app-1')
    expect(appRef.version_id).toBe('app-v1')
    payloads.forEach((payload) => expect(payload).toEqual(payloads[0]))
  })

  it('settles all DS with Promise.allSettled — a partial failure never aborts siblings (req 5.3)', async () => {
    const boom = new Error('build_and_activate failed for ds-fail')
    deploymentReleaseService.buildAndActivate.mockImplementation((id) =>
      id === 'ds-fail'
        ? Promise.reject(boom)
        : Promise.resolve({ data: { trace_id: `trace-${id}` } })
    )
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-ok', 'ds-fail', 'ds-after'])

    expect(results.map((entry) => ({ id: entry.id, ok: entry.ok }))).toEqual([
      { id: 'ds-ok', ok: true },
      { id: 'ds-fail', ok: false },
      { id: 'ds-after', ok: true }
    ])
    const after = results.find((entry) => entry.id === 'ds-after')
    expect(after.traceId).toBe('trace-ds-after')
    expect(after.error).toBeNull()
    const failed = results.find((entry) => entry.id === 'ds-fail')
    expect(failed.error).toBe(boom)
    expect(failed.traceId).toBeNull()
  })

  it('does NOT auto-retry a rejected DS — exactly one call for the failing id (req 5.3)', async () => {
    deploymentReleaseService.buildAndActivate.mockRejectedValue(new Error('persistent failure'))
    const { buildAndActivate, isDeploying } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-fail'])

    expect(
      deploymentReleaseService.buildAndActivate.mock.calls.filter(([id]) => id === 'ds-fail')
    ).toHaveLength(1)
    expect(results).toHaveLength(1)
    expect(results[0].ok).toBe(false)
    expect(isDeploying.value).toBe(false)
  })

  it('maps the versioned-URLs active limit (422 43007) to a typed errorType (req 5.5)', async () => {
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
    expect(buildAndActivateErrorTypes).toBe(BUILD_AND_ACTIVATE_ERROR_TYPES)
    expect(byId['ds-ok']).toMatchObject({ ok: true, errorType: null, traceId: 'trace-ds-ok' })
  })

  it('does NOT type a generic 422 lacking the 43007 code (no active-count assumed, req 7.2)', async () => {
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
    expect(payload.strategy).toBeTruthy()
  })
})

describe('build_and_activate write path — non-scoped unresolved-version guard (Fix 2)', () => {
  it('skips ALL DS with unresolved_version and issues NO service call when a resource has a null version', async () => {
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(
      {
        resources: [{ resource_id: 'app-1', resource_version: null, resource_type: 'application' }],
        canary: false,
        canaryForm: {}
      },
      ['ds-1', 'ds-2']
    )

    expect(deploymentReleaseService.buildAndActivate).not.toHaveBeenCalled()
    expect(results).toEqual([
      expect.objectContaining({
        id: 'ds-1',
        ok: false,
        skipped: true,
        skipReason: 'unresolved_version'
      }),
      expect.objectContaining({
        id: 'ds-2',
        ok: false,
        skipped: true,
        skipReason: 'unresolved_version'
      })
    ])
    expect(httpSpy).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('dispatches normally when every resource carries a concrete version', async () => {
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 'trace' } })
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-1'])

    expect(deploymentReleaseService.buildAndActivate).toHaveBeenCalledTimes(1)
    expect(results[0]).toMatchObject({ id: 'ds-1', ok: true })
  })
})

describe('build_and_activate write path — onOutcome progress seam', () => {
  it('reports every settled DS to onOutcome exactly once, matching the returned outcomes', async () => {
    deploymentReleaseService.buildAndActivate.mockImplementation((id) =>
      Promise.resolve({ data: { trace_id: `trace-${id}` } })
    )
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const reported = []
    const results = await buildAndActivate(composedPayload(), ['ds-1', 'ds-2', 'ds-3'], {
      onOutcome: (outcome) => reported.push(outcome)
    })

    expect(reported).toHaveLength(3)
    expect(reported.map((entry) => entry.id).sort()).toEqual(['ds-1', 'ds-2', 'ds-3'])
    expect(reported.every((entry) => entry.ok)).toBe(true)
    results.forEach((result) => expect(reported).toContain(result))
  })

  it('reports the failed DS with its error, isolated from succeeding siblings', async () => {
    const boom = new Error('build_and_activate failed')
    deploymentReleaseService.buildAndActivate.mockImplementation((id) =>
      id === 'ds-fail'
        ? Promise.reject(boom)
        : Promise.resolve({ data: { trace_id: `trace-${id}` } })
    )
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const reported = []
    await buildAndActivate(composedPayload(), ['ds-ok', 'ds-fail'], {
      onOutcome: (outcome) => reported.push(outcome)
    })

    const failed = reported.find((entry) => entry.id === 'ds-fail')
    expect(failed.ok).toBe(false)
    expect(failed.error).toBe(boom)
    expect(reported.find((entry) => entry.id === 'ds-ok').ok).toBe(true)
  })

  it('reports skipped DSs to onOutcome when a version is unresolved (no service call)', async () => {
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const reported = []
    const results = await buildAndActivate(
      {
        resources: [{ resource_id: 'app-1', resource_version: null, resource_type: 'application' }],
        canary: false,
        canaryForm: {}
      },
      ['ds-1', 'ds-2'],
      { onOutcome: (outcome) => reported.push(outcome) }
    )

    expect(deploymentReleaseService.buildAndActivate).not.toHaveBeenCalled()
    expect(reported).toHaveLength(2)
    expect(
      reported.every((entry) => entry.skipped && entry.skipReason === 'unresolved_version')
    ).toBe(true)
    expect(results).toEqual(reported)
  })

  it('is fully optional — omitting onOutcome preserves the returned outcomes', async () => {
    deploymentReleaseService.buildAndActivate.mockResolvedValue({ data: { trace_id: 'trace' } })
    const { buildAndActivate } = mountComposable()
    await flushPromises()

    const results = await buildAndActivate(composedPayload(), ['ds-1', 'ds-2'])
    expect(results.map((entry) => entry.id)).toEqual(['ds-1', 'ds-2'])
    expect(results.every((entry) => entry.ok)).toBe(true)
  })
})
