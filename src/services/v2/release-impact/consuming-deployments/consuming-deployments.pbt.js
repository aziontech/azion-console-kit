/**
 * Property-based test for the HOP 1 match rule (spec task 9.4, Property 4).
 *
 * Property 4 — `application` is matched by `global_id`, every other resource
 * type by `resource_id` (req 1.5). The rule lives in exactly one place —
 * `matchFieldFor` in `./contract.js` — and is consumed by `fanoutResolver`
 * (and, later, by `resourceUsageResolver`); this PBT pins both:
 *
 *   1. `matchFieldFor` returns `'global_id'` for `application` and
 *      `'resource_id'` for every other type — and nothing else.
 *   2. End-to-end through `createFanoutResolver` (fakes injected, no IO): a
 *      requested ref matches an active-release resource of the same type
 *      ONLY when the release's match-field id equals the requested
 *      `resource_id`. So an `application` ref matches on `global_id` and is
 *      NOT fooled by a release whose `resource_id` happens to collide; every
 *      non-application ref matches on `resource_id` and is NOT fooled by a
 *      colliding `global_id`.
 *
 * Validates requirement 1.5.
 *
 * fast-check is NOT yet a devDependency of this repo (see spec task 1.2
 * blockers). Mirroring the W0 arbitraries and the sibling PBTs, fast-check is
 * loaded LAZILY: if present the property suite runs at >= 100 iterations; if
 * absent it is SKIPPED with a clear reason and the deterministic guard suite
 * below still runs, keeping the file self-verifying.
 */
import { describe, it, expect } from 'vitest'
import { APPLICATION_RESOURCE_TYPE, matchFieldFor } from './contract'
import { createFanoutResolver } from './fanout-resolver'

// Resource types other than `application`; each must match by `resource_id`.
const NON_APPLICATION_TYPES = ['function', 'waf', 'cache_setting', 'rule_engine', 'origin']

// fast-check is optional today; load it lazily so the file stays importable.
let fc = null
try {
  fc = (await import('fast-check')).default
} catch {
  fc = null
}

const NUM_RUNS = 100

const describeOrSkip = fc ? describe : describe.skip
const skipReason = fc ? '' : ' (SKIPPED: fast-check is not installed — see spec task 1.2 blockers)'

// A resource-ref arbitrary: an `application` ref (matched by global_id) or a
// ref of some other type (matched by resource_id). `idArb` lets a caller mix
// numeric and string ids so the rule is exercised across both.
const idArb = (fcModule) =>
  fcModule.oneof(
    fcModule.string({ minLength: 1, maxLength: 12 }),
    fcModule.integer({ min: 1, max: 999999 })
  )

const applicationRefArb = (fcModule) =>
  fcModule.record({
    resource_type: fcModule.constant(APPLICATION_RESOURCE_TYPE),
    resource_id: idArb(fcModule)
  })

const otherRefArb = (fcModule) =>
  fcModule.record({
    resource_type: fcModule.constantFrom(...NON_APPLICATION_TYPES),
    resource_id: idArb(fcModule)
  })

// A fan-out resolver wired to fakes: one DS whose active release carries the
// supplied resources, no IO. Only the match rule is under test, so the DS list
// is a single deployment and the release composition is injected directly.
const DS_ID = 'ds-under-test'

const fakeResolverOver = (releaseResources) =>
  createFanoutResolver({
    deploymentService: {
      listDeploymentsService: async () => ({ body: [{ id: DS_ID }], count: 1 })
    },
    deploymentReleaseService: {
      getActiveReleaseComposition: async () => ({ resources: releaseResources })
    }
  })

describeOrSkip(`HOP 1 match rule — Property 4${skipReason}`, () => {
  it('matchFieldFor selects global_id for application and resource_id otherwise', () => {
    fc.assert(
      fc.property(fc.oneof(applicationRefArb(fc), otherRefArb(fc)), (resource) => {
        const field = matchFieldFor(resource)
        return resource.resource_type === APPLICATION_RESOURCE_TYPE
          ? field === 'global_id'
          : field === 'resource_id'
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('matches an application ref by global_id and is not fooled by a colliding resource_id', async () => {
    await fc.assert(
      fc.asyncProperty(applicationRefArb(fc), idArb(fc), async (ref, decoyId) => {
        // Decoy must be a genuinely different id, else it is a legitimate match.
        fc.pre(String(decoyId) !== String(ref.resource_id))

        // The release carries the application keyed by global_id == the request,
        // but its resource_id is a DIFFERENT (decoy) id. Matching by resource_id
        // would miss it; matching by global_id finds it (req 1.5).
        const release = [
          {
            resource_type: APPLICATION_RESOURCE_TYPE,
            global_id: ref.resource_id,
            resource_id: decoyId,
            version_id: 7
          }
        ]
        const { matchedByDeployment } = await fakeResolverOver(release)(ref)
        const matched = matchedByDeployment.get(DS_ID) ?? []
        return matched.length === 1 && matched[0] === ref
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('does NOT match an application ref when only resource_id (not global_id) collides', async () => {
    await fc.assert(
      fc.asyncProperty(applicationRefArb(fc), idArb(fc), async (ref, otherGlobalId) => {
        fc.pre(String(otherGlobalId) !== String(ref.resource_id))

        // The release's resource_id equals the request, but global_id differs.
        // The application rule keys on global_id, so this must NOT match.
        const release = [
          {
            resource_type: APPLICATION_RESOURCE_TYPE,
            global_id: otherGlobalId,
            resource_id: ref.resource_id,
            version_id: 7
          }
        ]
        const { deployments } = await fakeResolverOver(release)(ref)
        return deployments.length === 0
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('matches a non-application ref by resource_id and is not fooled by a colliding global_id', async () => {
    await fc.assert(
      fc.asyncProperty(otherRefArb(fc), idArb(fc), async (ref, decoyGlobalId) => {
        // The release carries the resource keyed by resource_id == the request,
        // with a different global_id. Non-application types match by resource_id,
        // so the global_id is irrelevant and must not block the match (req 1.5).
        const release = [
          {
            resource_type: ref.resource_type,
            resource_id: ref.resource_id,
            global_id: decoyGlobalId,
            version_id: 3
          }
        ]
        const { matchedByDeployment } = await fakeResolverOver(release)(ref)
        const matched = matchedByDeployment.get(DS_ID) ?? []
        return matched.length === 1 && matched[0] === ref
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('does NOT match a non-application ref when only global_id (not resource_id) collides', async () => {
    await fc.assert(
      fc.asyncProperty(otherRefArb(fc), idArb(fc), async (ref, otherResourceId) => {
        fc.pre(String(otherResourceId) !== String(ref.resource_id))

        // The release's global_id equals the request, but resource_id differs.
        // Non-application types key on resource_id, so this must NOT match.
        const release = [
          {
            resource_type: ref.resource_type,
            resource_id: otherResourceId,
            global_id: ref.resource_id,
            version_id: 3
          }
        ]
        const { deployments } = await fakeResolverOver(release)(ref)
        return deployments.length === 0
      }),
      { numRuns: NUM_RUNS }
    )
  })
})

// Deterministic guard so the file is meaningful even without fast-check: it
// pins the match rule against hand-built cases — application keyed by global_id,
// every other type by resource_id (req 1.5).
describe('HOP 1 match rule — Property 4 (deterministic guard)', () => {
  it('matchFieldFor: global_id for application, resource_id for other types', () => {
    expect(matchFieldFor({ resource_type: 'application', resource_id: 'a-1' })).toBe('global_id')
    expect(matchFieldFor({ resource_type: 'function', resource_id: 'f-1' })).toBe('resource_id')
    expect(matchFieldFor({ resource_type: 'waf', resource_id: 5 })).toBe('resource_id')
  })

  it('matches application by global_id (not resource_id) and others by resource_id (not global_id)', async () => {
    const appRef = { resource_type: 'application', resource_id: 'app-global-1' }
    const fnRef = { resource_type: 'function', resource_id: 42 }

    // Release: app matched via global_id with a decoy resource_id; function
    // matched via resource_id with a decoy global_id.
    const release = [
      {
        resource_type: 'application',
        global_id: 'app-global-1',
        resource_id: 'decoy',
        version_id: 11
      },
      { resource_type: 'function', resource_id: 42, global_id: 'decoy-global', version_id: 4 }
    ]

    const resolver = fakeResolverOver(release)

    const appResult = await resolver(appRef)
    expect(appResult.deployments).toHaveLength(1)
    expect(appResult.matchedByDeployment.get(DS_ID)).toEqual([appRef])

    const fnResult = await resolver(fnRef)
    expect(fnResult.deployments).toHaveLength(1)
    expect(fnResult.matchedByDeployment.get(DS_ID)).toEqual([fnRef])
  })

  it('does not match application when only resource_id collides', async () => {
    const appRef = { resource_type: 'application', resource_id: 'app-global-1' }
    const release = [
      {
        resource_type: 'application',
        global_id: 'different-global',
        resource_id: 'app-global-1',
        version_id: 1
      }
    ]
    const { deployments } = await fakeResolverOver(release)(appRef)
    expect(deployments).toHaveLength(0)
  })
})
