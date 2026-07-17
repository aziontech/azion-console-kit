/**
 * Property-based test for the HOP 1 match rule (spec task 9.4, Property 4).
 *
 * Property 4 — every resource is matched by `resource_id` (req 1.5). The
 * deployment-api now returns every resource id under `resource_id` (for
 * `application` its value is the `global_id`); the legacy response shape, which
 * surfaced `application` under `global_id`, still matches via the fallback in
 * `matchIdValue` (`./contract.js`) consumed by `fanoutResolver` (and
 * `resourceUsageResolver`). This PBT pins both:
 *
 *   1. `matchIdValue` reads `resource_id`, falling back to `global_id`, else null.
 *   2. End-to-end through `createFanoutResolver` (fakes injected, no IO): a
 *      requested ref matches an active-release resource of the same type ONLY
 *      when its id (`resource_id`, or the legacy `global_id`) equals the requested
 *      `resource_id`; a differing id never matches.
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
import { APPLICATION_RESOURCE_TYPE, matchIdValue } from './contract'
import { createFanoutResolver } from './fanout-resolver'

// The resource types the rule is exercised across; each matches by resource_id.
const RESOURCE_TYPES = [APPLICATION_RESOURCE_TYPE, 'function', 'waf', 'cache_setting', 'origin']

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

// `idArb` mixes numeric and string ids so the rule is exercised across both.
const idArb = (fcModule) =>
  fcModule.oneof(
    fcModule.string({ minLength: 1, maxLength: 12 }),
    fcModule.integer({ min: 1, max: 999999 })
  )

// A resource-ref arbitrary of some type; every type matches by resource_id.
const refArb = (fcModule) =>
  fcModule.record({
    resource_type: fcModule.constantFrom(...RESOURCE_TYPES),
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
  it('matchIdValue reads resource_id, falling back to global_id, else null', () => {
    fc.assert(
      fc.property(refArb(fc), idArb(fc), (ref, legacyId) => {
        // resource_id present → it wins over any legacy global_id.
        if (matchIdValue({ resource_id: ref.resource_id, global_id: legacyId }) !== ref.resource_id)
          return false
        // resource_id absent → global_id is the fallback.
        if (matchIdValue({ global_id: legacyId }) !== legacyId) return false
        // neither present → null.
        return matchIdValue({}) === null
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('matches a ref by resource_id and is not fooled by a different id', async () => {
    await fc.assert(
      fc.asyncProperty(refArb(fc), idArb(fc), async (ref, decoyId) => {
        // Decoy must be a genuinely different id, else it is a legitimate match.
        fc.pre(String(decoyId) !== String(ref.resource_id))

        // The release carries the resource keyed by resource_id == the request.
        const release = [
          { resource_type: ref.resource_type, resource_id: ref.resource_id, version_id: 7 }
        ]
        const { matchedByDeployment } = await fakeResolverOver(release)(ref)
        const matched = matchedByDeployment.get(DS_ID) ?? []
        if (!(matched.length === 1 && matched[0] === ref)) return false

        // A release whose only id is the decoy must NOT match.
        const decoyRelease = [
          { resource_type: ref.resource_type, resource_id: decoyId, version_id: 7 }
        ]
        const { deployments } = await fakeResolverOver(decoyRelease)(ref)
        return deployments.length === 0
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('matches an application ref via the legacy global_id-only shape (fallback)', async () => {
    await fc.assert(
      fc.asyncProperty(idArb(fc), async (id) => {
        const ref = { resource_type: APPLICATION_RESOURCE_TYPE, resource_id: id }
        // Legacy shape: the id surfaces under global_id, resource_id absent.
        const release = [{ resource_type: APPLICATION_RESOURCE_TYPE, global_id: id, version_id: 7 }]
        const { matchedByDeployment } = await fakeResolverOver(release)(ref)
        const matched = matchedByDeployment.get(DS_ID) ?? []
        return matched.length === 1 && matched[0] === ref
      }),
      { numRuns: NUM_RUNS }
    )
  })
})

// Deterministic guard so the file is meaningful even without fast-check: it pins
// the match rule against hand-built cases — every resource matched by
// resource_id, with a legacy global_id fallback (req 1.5).
describe('HOP 1 match rule — Property 4 (deterministic guard)', () => {
  it('matchIdValue: resource_id when present, else global_id, else null', () => {
    expect(
      matchIdValue({ resource_type: 'application', resource_id: 'a-1', global_id: 'g-1' })
    ).toBe('a-1')
    expect(matchIdValue({ resource_type: 'application', global_id: 'g-1' })).toBe('g-1')
    expect(matchIdValue({ resource_type: 'function', resource_id: 'f-1' })).toBe('f-1')
    expect(matchIdValue({})).toBeNull()
  })

  it('matches every type by resource_id (application via its global_id value)', async () => {
    const appRef = { resource_type: 'application', resource_id: 'app-1' }
    const fnRef = { resource_type: 'function', resource_id: 42 }

    const release = [
      { resource_type: 'application', resource_id: 'app-1', version_id: 11 },
      { resource_type: 'function', resource_id: 42, version_id: 4 }
    ]

    const resolver = fakeResolverOver(release)

    const appResult = await resolver(appRef)
    expect(appResult.deployments).toHaveLength(1)
    expect(appResult.matchedByDeployment.get(DS_ID)).toEqual([appRef])

    const fnResult = await resolver(fnRef)
    expect(fnResult.deployments).toHaveLength(1)
    expect(fnResult.matchedByDeployment.get(DS_ID)).toEqual([fnRef])
  })

  it('matches an application via the legacy global_id-only shape', async () => {
    const appRef = { resource_type: 'application', resource_id: 'app-1' }
    const release = [{ resource_type: 'application', global_id: 'app-1', version_id: 1 }]
    const { deployments } = await fakeResolverOver(release)(appRef)
    expect(deployments).toHaveLength(1)
  })

  it('does not match when the id differs', async () => {
    const appRef = { resource_type: 'application', resource_id: 'app-1' }
    const release = [{ resource_type: 'application', resource_id: 'different', version_id: 1 }]
    const { deployments } = await fakeResolverOver(release)(appRef)
    expect(deployments).toHaveLength(0)
  })
})
