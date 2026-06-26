// Property-Based Test — Property 6 (spec: new-release-data-layer, task 3.4).
//
// Property 6 (req 3.7, 3.8): when the source list was capped, the totals are
// reported as PARTIAL, never as exact. Concretely:
//   - `sourceCapped: true`  => `isPartial` is true on the aggregate AND on every
//     per-DS entry. The totals stay a FLOOR (the real counts are >= reported),
//     so a capped run can never present its numbers as an exact value.
//   - `sourceCapped: false` => `isPartial` is false everywhere. The display cap
//     (top-N) alone never flips `isPartial`: it only trims the rendered slice,
//     while the full per-DS list still drives `totalWorkloads`/`totalDomains`.
//
// fast-check, >=100 runs. Pure subject under test (no Vue, no IO), so the test
// is a plain property check with no harness.

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { computeImpactTotals } from './compute-impact-totals.js'

const NUM_RUNS = 200

/** A single reverse-lookup row (the shape buildReverseLookupByDs emits). */
const rowArb = fc.record({
  id: fc.oneof(fc.string(), fc.integer()),
  name: fc.oneof(fc.string(), fc.constant(null)),
  environmentId: fc.oneof(fc.integer(), fc.constant(null)),
  environmentName: fc.oneof(fc.string(), fc.constant(null)),
  domains: fc.array(fc.domain(), { maxLength: 25 })
})

/** A `workloadsByDs` index: `{ [dsId]: row[] }`, keyed by deployment id. */
const indexArb = fc.dictionary(
  fc.oneof(fc.string({ minLength: 1 }), fc.integer({ min: 1 }).map(String)),
  fc.array(rowArb, { maxLength: 30 }),
  { maxKeys: 12 }
)

/** Display cap: positive integers, plus the "no cap" degenerate values. */
const capArb = fc.oneof(fc.integer({ min: 1, max: 30 }), fc.constantFrom(0, -1, undefined, 1.5))

describe('computeImpactTotals — Property 6 (capped => partial, never exact-when-capped)', () => {
  it('flags isPartial on aggregate AND every per-DS entry when the source was capped', () => {
    fc.assert(
      fc.property(indexArb, capArb, (index, cap) => {
        const { perDs, totals } = computeImpactTotals(index, { cap, sourceCapped: true })

        // The honesty flag is set everywhere the totals are reported.
        expect(totals.isPartial).toBe(true)
        expect(perDs.every((entry) => entry.isPartial === true)).toBe(true)
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('never sets isPartial when the source was NOT capped, regardless of display cap', () => {
    fc.assert(
      fc.property(indexArb, capArb, (index, cap) => {
        const { perDs, totals } = computeImpactTotals(index, { cap, sourceCapped: false })

        // The display cap (top-N) trims the rendered slice but is NOT a partial
        // signal: totals stay exact, so isPartial must remain false.
        expect(totals.isPartial).toBe(false)
        expect(perDs.every((entry) => entry.isPartial === false)).toBe(true)
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('keeps capped totals as a floor: reported counts are <= the true full counts', () => {
    fc.assert(
      fc.property(indexArb, capArb, (index, cap) => {
        const { perDs, totals } = computeImpactTotals(index, { cap, sourceCapped: true })

        // "Never reported as exact when capped" means the numbers must be a
        // lower bound on the real (uncapped) world — and the per-DS totals are
        // computed from the FULL list, so they equal the source we were given,
        // which is itself a truncated floor of reality. Verify internal
        // consistency: aggregate == sum of per-DS, never an inflated value.
        const sumWorkloads = perDs.reduce((sum, entry) => sum + entry.totalWorkloads, 0)
        const sumDomains = perDs.reduce((sum, entry) => sum + entry.totalDomains, 0)

        expect(totals.totalWorkloads).toBe(sumWorkloads)
        expect(totals.totalDomains).toBe(sumDomains)

        // A capped, partial result must never claim more than the (truncated)
        // source delivered — per DS, the rendered slice cannot exceed the total.
        expect(perDs.every((entry) => entry.topWorkloads.length <= entry.totalWorkloads)).toBe(true)
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('marks displayCapped without ever upgrading it to a partial-totals claim', () => {
    fc.assert(
      fc.property(indexArb, fc.integer({ min: 1, max: 30 }), (index, cap) => {
        const { perDs } = computeImpactTotals(index, { cap, sourceCapped: false })

        // When a per-DS list is longer than the display cap, displayCapped is
        // true — but because the source was not capped, the totals are still
        // exact (isPartial stays false). Display-capping and source-capping are
        // independent: only the latter can make totals partial (req 3.7 / 3.8).
        perDs.forEach((entry) => {
          const hiddenWorkloads = entry.totalWorkloads > entry.topWorkloads.length
          if (hiddenWorkloads) {
            expect(entry.displayCapped).toBe(true)
          }
          expect(entry.isPartial).toBe(false)
        })
      }),
      { numRuns: NUM_RUNS }
    )
  })
})
