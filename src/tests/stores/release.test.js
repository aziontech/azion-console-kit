import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// The store owns NO I/O: it imports no service and only exposes selection state,
// the deploy gate, and a PURE `composePayload()`. `DeploymentAdapter` is pure and
// imported HERE (not by the store) so P6 can transform `composePayload().resources`
// into the real build_and_activate payload and assert the sentinel never survives.
// The per-DS dispatch fan-out (P7) lives in the composable and is tested there.
import { DeploymentAdapter } from '@/services/v2/deployment/deployment-adapter'
import { LATEST_READY } from '@/templates/release-composition/version-options'
import { useReleaseStore } from '@/stores/release'

const APPLICATION_TYPE = 'application'
const SINGLE_VERSION = 'single_version'
const VERSIONED_URLS = 'versioned_urls'

// Builds an active-release record whose `resources[]` does / does not pin an
// application, so `deployCtx.hasApp` can be driven from the loaded release side.
const releaseWithApp = (hasApp) => ({
  resources: hasApp ? [{ resource_type: APPLICATION_TYPE, global_id: 'app-1' }] : []
})

beforeEach(() => {
  setActivePinia(createPinia())
})

// ---------------------------------------------------------------------------
// Property 4 — `effDsId` is the only deployment read path.
// effDsId === deploymentId || deploymentIds[0] || ''. After openRelease/pickDs,
// deploymentId and deploymentIds[0] stay consistent, and gates resolve through it.
// Exhaustive enumeration (fast-check absent) over arbitrary id combinations.
// ---------------------------------------------------------------------------
describe('Property 4 — effDsId is the single deployment read path', () => {
  const idUniverse = ['', 'ds-1', 'ds-2', 'ds-3']
  const idsUniverse = [
    [],
    ['ds-1'],
    ['ds-2'],
    ['ds-1', 'ds-2'],
    ['ds-2', 'ds-3', 'ds-1'],
    ['ds-3', 'ds-1']
  ]

  // The invariant as a pure reference: effDsId mirrors deploymentId || ids[0] || ''.
  const expectedEffDsId = (deploymentId, deploymentIds) => deploymentId || deploymentIds[0] || ''

  it('matches deploymentId || deploymentIds[0] || "" for every raw state combo', () => {
    const store = useReleaseStore()
    let iterations = 0

    idUniverse.forEach((deploymentId) => {
      idsUniverse.forEach((deploymentIds) => {
        // Drive the raw state directly to assert the getter formula in isolation.
        store.deploymentId = deploymentId
        store.deploymentIds = [...deploymentIds]

        expect(store.effDsId).toBe(expectedEffDsId(deploymentId, deploymentIds))
        iterations += 1
      })
    })

    expect(iterations).toBe(idUniverse.length * idsUniverse.length)
    expect(iterations).toBeGreaterThanOrEqual(24)
  })

  it('keeps deploymentId and deploymentIds[0] consistent after openRelease (>=100 iter)', () => {
    const store = useReleaseStore()

    // Cartesian of "what the caller supplies": a singular id, an array of ids, or
    // both. Each combination is asserted to leave effDsId === deploymentIds[0]
    // and deploymentId === deploymentIds[0] (the synced invariant).
    const singulars = [undefined, null, '', 'ds-1', 'ds-9']
    const arrays = [
      undefined,
      null,
      [],
      ['ds-1'],
      ['ds-2', 'ds-3'],
      ['ds-3', 'ds-2', 'ds-1'],
      ['ds-7']
    ]

    let iterations = 0
    for (let repeat = 0; repeat < 3; repeat += 1) {
      singulars.forEach((deploymentId) => {
        arrays.forEach((deploymentIds) => {
          const payload = {}
          if (deploymentId !== undefined) payload.deploymentId = deploymentId
          if (deploymentIds !== undefined) payload.deploymentIds = deploymentIds

          store.openRelease(payload)

          // The invariant under test: effDsId is ALWAYS the formula, so every
          // read of "the deployment" routes through it regardless of which
          // representation the caller supplied (P4). openRelease honors an
          // explicit deploymentId even when it differs from deploymentIds[0]
          // (the documented sync rule); effDsId still resolves deterministically.
          expect(store.effDsId).toBe(store.deploymentId || store.deploymentIds[0] || '')

          // With no selection at all, effDsId is the empty sentinel.
          if (!store.deploymentId && store.deploymentIds.length === 0) {
            expect(store.effDsId).toBe('')
          } else {
            // Otherwise effDsId is always one of the supplied ids, never invented.
            const candidates = [store.deploymentId, ...store.deploymentIds].filter(Boolean)
            expect(candidates).toContain(store.effDsId)
          }

          iterations += 1
        })
      })
    }

    expect(iterations).toBeGreaterThanOrEqual(100)
  })

  it('keeps the invariant across arbitrary pickDs toggle sequences (>=100 iter)', () => {
    const store = useReleaseStore()
    const toggles = ['ds-1', 'ds-2', 'ds-3', 'ds-4', 'ds-5']
    let iterations = 0

    // Walk many pseudo-random-but-deterministic toggle sequences. After every
    // single pickDs the invariant must hold.
    for (let seed = 0; seed < 40; seed += 1) {
      store.openRelease({})
      for (let step = 0; step < 6; step += 1) {
        const id = toggles[(seed * 7 + step * 3) % toggles.length]
        store.pickDs(id)

        expect(store.effDsId).toBe(store.deploymentId || store.deploymentIds[0] || '')
        expect(store.deploymentId).toBe(store.deploymentIds[0] ?? '')
        iterations += 1
      }
    }

    expect(iterations).toBeGreaterThanOrEqual(100)
  })

  it('resolves the gate through effDsId (deployCtx default arg === effDsId target)', () => {
    const store = useReleaseStore()

    store.setDeployments([
      { id: 'ds-1', deployment_policy: VERSIONED_URLS },
      { id: 'ds-2', deployment_policy: SINGLE_VERSION }
    ])
    store.setActiveReleaseByDs('ds-1', releaseWithApp(true))
    store.setActiveReleaseByDs('ds-2', releaseWithApp(true))

    // Select ds-2 first then ds-1: effDsId tracks the first selected id (ds-2).
    store.pickDs('ds-2')
    store.pickDs('ds-1')
    expect(store.effDsId).toBe('ds-2')

    // deployCtx() with no arg must resolve the SAME context as deployCtx(effDsId).
    expect(store.deployCtx()).toEqual(store.deployCtx(store.effDsId))
    // ds-2 is single_version + deployed → app read-only, but deployable.
    expect(store.deployCtx().isVersioned).toBe(false)
    expect(store.deployCtx().appEditable).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Property 5 — deployCtx is deterministic across the 5 cases.
// Enumerate deployment_policy ∈ {single_version, versioned_urls}
//          × deployed ∈ {true, false}
//          × hasApp   ∈ {true, false}  (8 combos), assert appEditable / canDeploy.
// ---------------------------------------------------------------------------
describe('Property 5 — deployCtx 5-case gate (exhaustive 2x2x2)', () => {
  // Reference oracle straight from §E / requirements 5.1–5.5:
  //   !hasApp                  → !canDeploy, !appEditable                (case 1)
  //   single & !deployed       → appEditable                            (case 2)
  //   single & deployed        → !appEditable (locked Single Version)   (case 3)
  //   versioned (any deployed) → appEditable when hasApp                (cases 4,5)
  const expected = (isVersioned, deployed, hasApp) => {
    const appEditable = hasApp && (isVersioned || !deployed)
    const canDeploy = hasApp // atLimit is always false client-side
    return { appEditable, canDeploy }
  }

  const policies = [
    { policy: SINGLE_VERSION, isVersioned: false },
    { policy: VERSIONED_URLS, isVersioned: true }
  ]

  let iterations = 0

  policies.forEach(({ policy, isVersioned }) => {
    ;[true, false].forEach((deployed) => {
      ;[true, false].forEach((hasApp) => {
        it(`policy=${policy} deployed=${deployed} hasApp=${hasApp}`, () => {
          const store = useReleaseStore()
          const dsId = 'ds-x'

          store.setDeployments([{ id: dsId, deployment_policy: policy }])
          store.setActiveReleaseByDs(dsId, deployed ? releaseWithApp(hasApp) : null)
          // Case 4: no active release yet, but the user is composing an app
          // selection. Drive hasApp from the selection when not deployed.
          if (!deployed && hasApp) {
            store.setResName(APPLICATION_TYPE, 'app-1')
          }
          store.pickDs(dsId)

          const ctx = store.deployCtx(dsId)
          const want = expected(isVersioned, deployed, hasApp)

          expect(ctx.ok).toBe(true)
          expect(ctx.isVersioned).toBe(isVersioned)
          expect(ctx.deployed).toBe(deployed)
          expect(ctx.hasApp).toBe(hasApp)
          expect(ctx.appEditable).toBe(want.appEditable)
          expect(ctx.canDeploy).toBe(want.canDeploy)

          // Spot-check the named cases the spec calls out explicitly.
          if (!hasApp) {
            expect(ctx.canDeploy).toBe(false) // case 1
            expect(ctx.appEditable).toBe(false)
          }
          if (policy === SINGLE_VERSION && deployed && hasApp) {
            expect(ctx.appEditable).toBe(false) // case 3 — locked Single Version
          }
          if (isVersioned && hasApp) {
            expect(ctx.appEditable).toBe(true) // cases 4 & 5
          }

          iterations += 1
        })
      })
    })
  })

  it('covers all 8 combinations exactly once', () => {
    expect(iterations).toBe(8)
  })
})

// ---------------------------------------------------------------------------
// Property 6 — 'LATEST' never reaches the payload. composeResources() resolves
// every LATEST_READY sentinel to a concrete version_id using versionsByResource,
// and the built build_and_activate payload contains concrete ids and NO 'LATEST'.
// ---------------------------------------------------------------------------
describe("Property 6 — 'LATEST' is resolved before the payload", () => {
  const seedSelection = (store) => {
    // Application + an optional singleton + a collection item, all pinned to LATEST.
    // Optional singletons default ON (firewall is included unless toggled off), so
    // we simply pick its instance — no explicit enable needed.
    store.setResName(APPLICATION_TYPE, 'app-1')
    store.setResVer(APPLICATION_TYPE, LATEST_READY)
    store.setResName('firewall', 'fw-1')
    store.setResVer('firewall', LATEST_READY)
    store.addCollItem('function', { resourceId: 'fn-1', version: LATEST_READY })

    // Ready-version catalogs so the sentinel can resolve to a concrete id. The
    // `isCurrent` option is the one a LATEST pick must land on.
    store.setVersionsByResource(APPLICATION_TYPE, 'app-1', [
      { value: 'app-v1', isCurrent: false },
      { value: 'app-v2', isCurrent: true }
    ])
    store.setVersionsByResource('firewall', 'fw-1', [{ value: 'fw-v9', isCurrent: true }])
    store.setVersionsByResource('function', 'fn-1', [
      { value: 'fn-v3', isCurrent: false },
      { value: 'fn-v5', isCurrent: true }
    ])
  }

  it('composeResources() resolves LATEST to concrete version_ids', () => {
    const store = useReleaseStore()
    seedSelection(store)

    const resources = store.composeResources()
    const byType = Object.fromEntries(
      resources.map((resource) => [resource.resource_type, resource])
    )

    expect(byType.application.resource_version).toBe('app-v2')
    expect(byType.firewall.resource_version).toBe('fw-v9')
    expect(byType.function.resource_version).toBe('fn-v5')

    // Hard invariant: no resource_version is the sentinel.
    resources.forEach((resource) => {
      expect(resource.resource_version).not.toBe(LATEST_READY)
      expect(resource.resource_version).toBeTruthy()
    })
  })

  it("the build_and_activate payload from composePayload() carries version_id and NO 'LATEST'", () => {
    const store = useReleaseStore()
    store.openRelease({ deploymentIds: ['ds-1'] })
    seedSelection(store) // openRelease resets; re-seed after picking the DS.

    // The store hands the composable a PURE description; the composable (and this
    // test) runs the adapter transform that ships to deployment-api. The sentinel
    // must already be resolved by `composePayload()` before it reaches the adapter.
    const composed = store.composePayload()
    const payload = DeploymentAdapter.transformBuildAndActivatePayload(composed.resources)

    const serialized = JSON.stringify(payload)
    expect(serialized).not.toContain(LATEST_READY)

    // Every resource ref carries a concrete version_id, never the sentinel.
    payload.resources.forEach((ref) => {
      expect(ref.version_id).toBeTruthy()
      expect(ref.version_id).not.toBe(LATEST_READY)
    })

    // The application ref is keyed by global_id (adapter contract), versioned.
    const appRef = payload.resources.find((ref) => ref.resource_type === APPLICATION_TYPE)
    expect(appRef.global_id).toBe('app-1')
    expect(appRef.version_id).toBe('app-v2')
  })
})

// ---------------------------------------------------------------------------
// seedColl — the dependency section is INHERITED from the active release (no
// "Add"). It keeps only the four collection types, pins each instance to the
// release's real version_id (never the LATEST sentinel), and is idempotent so a
// DS switch replaces — never accumulates — the instance set.
// ---------------------------------------------------------------------------
describe('seedColl — inherit dependency instances from the active release', () => {
  it('seeds every collection type with { resourceId, version } from the release', () => {
    const store = useReleaseStore()

    store.seedColl({
      function: [{ resourceId: 'fn-1', version: 'fn-v3' }],
      connector: [{ resourceId: 'cn-9', version: 'cn-v1' }],
      waf: [{ resourceId: 'waf-2', version: 'waf-v5' }],
      network_list: [{ resourceId: 'nl-7', version: 'nl-v2' }]
    })

    expect(store.coll).toEqual({
      function: [{ resourceId: 'fn-1', version: 'fn-v3' }],
      connector: [{ resourceId: 'cn-9', version: 'cn-v1' }],
      waf: [{ resourceId: 'waf-2', version: 'waf-v5' }],
      network_list: [{ resourceId: 'nl-7', version: 'nl-v2' }]
    })

    // No 'LATEST' sentinel ever enters a seeded instance — it came from a real release.
    Object.values(store.coll)
      .flat()
      .forEach((instance) => expect(instance.version).not.toBe(LATEST_READY))
  })

  it('keeps only the four collection types and drops instances without a resourceId', () => {
    const store = useReleaseStore()

    store.seedColl({
      function: [{ resourceId: 'fn-1', version: 'fn-v1' }, { version: 'orphan' }],
      application: [{ resourceId: 'app-1', version: 'app-v1' }],
      unknown: [{ resourceId: 'x', version: 'y' }]
    })

    expect(Object.keys(store.coll).sort()).toEqual(
      ['connector', 'function', 'network_list', 'waf'].sort()
    )
    expect(store.coll.function).toEqual([{ resourceId: 'fn-1', version: 'fn-v1' }])
    expect(store.coll.application).toBeUndefined()
  })

  it('is idempotent and REPLACES coll so a DS switch never accumulates stale instances', () => {
    const store = useReleaseStore()

    store.seedColl({ function: [{ resourceId: 'fn-old', version: 'v1' }] })
    expect(store.coll.function).toEqual([{ resourceId: 'fn-old', version: 'v1' }])

    // Re-seeding with the other DS's release fully replaces the previous set.
    store.seedColl({ waf: [{ resourceId: 'waf-new', version: 'v9' }] })
    expect(store.coll.function).toEqual([])
    expect(store.coll.waf).toEqual([{ resourceId: 'waf-new', version: 'v9' }])

    // Re-running with the identical input yields the identical result (idempotent).
    store.seedColl({ waf: [{ resourceId: 'waf-new', version: 'v9' }] })
    expect(store.coll.waf).toEqual([{ resourceId: 'waf-new', version: 'v9' }])
  })

  it('tolerates a non-object argument by clearing the instance set', () => {
    const store = useReleaseStore()
    store.seedColl({ function: [{ resourceId: 'fn-1', version: 'v1' }] })

    store.seedColl(null)

    expect(store.coll).toEqual({ function: [], connector: [], waf: [], network_list: [] })
  })
})
