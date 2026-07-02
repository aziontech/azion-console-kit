import { describe, it, expect } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useReleaseImpact } from './use-release-impact.js'

let fc = null
try {
  // eslint-disable-next-line global-require
  fc = (await import('fast-check')).default
} catch {
  fc = null
}

const NUM_RUNS = 100

const describeOrSkip = fc ? describe : describe.skip
const skipReason = fc ? '' : ' (SKIPPED: fast-check is not installed)'

const withFc = (build) => (fc ? build(fc) : null)

const DS_ID = 'ds-target'

// A row as `buildReverseLookupByDs` emits it. `id` is drawn from a small pool so
// runs regularly repeat ids (exercising the DISTINCT-by-`id` count), and
// `environmentName` mixes valid names with the omit-worthy values (null / '').
const rowArb = withFc((arb) =>
  arb.record({
    id: arb.constantFrom('wl-1', 'wl-2', 'wl-3'),
    name: arb.string(),
    domains: arb.constant([]),
    environmentId: arb.constantFrom('env-1', 'env-2', 'env-3'),
    environmentName: arb.oneof(
      arb.constant(null),
      arb.constant(''),
      arb.constantFrom('Production', 'Staging', 'Development')
    )
  })
)

const rowsArb = withFc((arb) => arb.array(rowArb, { maxLength: 12 }))

const metaFor = async (rows) => {
  const lookupService = {
    getReverseLookup: () => Promise.resolve({ index: { [DS_ID]: rows }, isPartial: false })
  }
  const { dsMetaFor } = useReleaseImpact({ lookupService })
  await flushPromises()
  return dsMetaFor(DS_ID)
}

const expectedDistinctIds = (rows) => new Set(rows.map((row) => row.id)).size

const expectedEnvNames = (rows) => [
  ...new Set(rows.map((row) => row.environmentName).filter((name) => name != null && name !== ''))
]

describeOrSkip(`useReleaseImpact.dsMetaFor — invariants${skipReason}`, () => {
  it('workloadsCount equals the number of DISTINCT row ids (repeats counted once)', async () => {
    await fc.assert(
      fc.asyncProperty(rowsArb, async (rows) => {
        const meta = await metaFor(rows)
        if (rows.length === 0) return true
        return meta.workloadsCount === expectedDistinctIds(rows)
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('environmentNames (when present) has no duplicates nor null/empty, in first-occurrence order', async () => {
    await fc.assert(
      fc.asyncProperty(rowsArb, async (rows) => {
        const meta = await metaFor(rows)
        if (!('environmentNames' in meta)) return true

        const names = meta.environmentNames
        const noBlanks = names.every((name) => name != null && name !== '')
        const noDupes = new Set(names).size === names.length
        const ordered = expect(names).toEqual(expectedEnvNames(rows))

        return noBlanks && noDupes && ordered === undefined
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('OMITS environmentNames when no row carries a valid environment name', async () => {
    await fc.assert(
      fc.asyncProperty(rowsArb, async (rows) => {
        const meta = await metaFor(rows)
        if (expectedEnvNames(rows).length > 0) return true
        return !('environmentNames' in meta)
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('returns {} for a DS with no rows in the resolved index', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom('ds-absent', 'ds-none'), async (dsId) => {
        const lookupService = {
          getReverseLookup: () => Promise.resolve({ index: { [DS_ID]: [] }, isPartial: false })
        }
        const { dsMetaFor } = useReleaseImpact({ lookupService })
        await flushPromises()
        expect(dsMetaFor(dsId)).toEqual({})
        return true
      }),
      { numRuns: NUM_RUNS }
    )
  })
})
