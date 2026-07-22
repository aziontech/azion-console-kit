import { describe, it, expect } from 'vitest'
import { APPLICATION_RESOURCE_TYPE, matchIdValue } from './contract'
import { createFanoutResolver } from './fanout-resolver'

const RESOURCE_TYPES = [APPLICATION_RESOURCE_TYPE, 'function', 'waf', 'cache_setting', 'origin']

let fc = null
try {
  fc = (await import('fast-check')).default
} catch {
  fc = null
}

const NUM_RUNS = 100

const describeOrSkip = fc ? describe : describe.skip
const skipReason = fc ? '' : ' (SKIPPED: fast-check is not installed — see spec task 1.2 blockers)'

const idArb = (fcModule) =>
  fcModule.oneof(
    fcModule.string({ minLength: 1, maxLength: 12 }),
    fcModule.integer({ min: 1, max: 999999 })
  )

const refArb = (fcModule) =>
  fcModule.record({
    resource_type: fcModule.constantFrom(...RESOURCE_TYPES),
    resource_id: idArb(fcModule)
  })

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
        if (matchIdValue({ resource_id: ref.resource_id, global_id: legacyId }) !== ref.resource_id)
          return false
        if (matchIdValue({ global_id: legacyId }) !== legacyId) return false
        return matchIdValue({}) === null
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('matches a ref by resource_id and is not fooled by a different id', async () => {
    await fc.assert(
      fc.asyncProperty(refArb(fc), idArb(fc), async (ref, decoyId) => {
        fc.pre(String(decoyId) !== String(ref.resource_id))

        const release = [
          { resource_type: ref.resource_type, resource_id: ref.resource_id, version_id: 7 }
        ]
        const { matchedByDeployment } = await fakeResolverOver(release)(ref)
        const matched = matchedByDeployment.get(DS_ID) ?? []
        if (!(matched.length === 1 && matched[0] === ref)) return false

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
        const release = [{ resource_type: APPLICATION_RESOURCE_TYPE, global_id: id, version_id: 7 }]
        const { matchedByDeployment } = await fakeResolverOver(release)(ref)
        const matched = matchedByDeployment.get(DS_ID) ?? []
        return matched.length === 1 && matched[0] === ref
      }),
      { numRuns: NUM_RUNS }
    )
  })
})

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
