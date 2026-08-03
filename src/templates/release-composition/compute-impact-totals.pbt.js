import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { computeImpactTotals } from './compute-impact-totals.js'

const NUM_RUNS = 200

const rowArb = fc.record({
  id: fc.oneof(fc.string(), fc.integer()),
  name: fc.oneof(fc.string(), fc.constant(null)),
  environmentId: fc.oneof(fc.integer(), fc.constant(null)),
  environmentName: fc.oneof(fc.string(), fc.constant(null)),
  domains: fc.array(fc.domain(), { maxLength: 25 })
})

const indexArb = fc.dictionary(
  fc.oneof(fc.string({ minLength: 1 }), fc.integer({ min: 1 }).map(String)),
  fc.array(rowArb, { maxLength: 30 }),
  { maxKeys: 12 }
)

const capArb = fc.oneof(fc.integer({ min: 1, max: 30 }), fc.constantFrom(0, -1, undefined, 1.5))

describe('computeImpactTotals — Property 6 (capped => partial, never exact-when-capped)', () => {
  it('flags isPartial on aggregate AND every per-DS entry when the source was capped', () => {
    fc.assert(
      fc.property(indexArb, capArb, (index, cap) => {
        const { perDs, totals } = computeImpactTotals(index, { cap, sourceCapped: true })

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

        const sumWorkloads = perDs.reduce((sum, entry) => sum + entry.totalWorkloads, 0)
        const sumDomains = perDs.reduce((sum, entry) => sum + entry.totalDomains, 0)

        expect(totals.totalWorkloads).toBe(sumWorkloads)
        expect(totals.totalDomains).toBe(sumDomains)

        expect(perDs.every((entry) => entry.topWorkloads.length <= entry.totalWorkloads)).toBe(true)
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('marks displayCapped without ever upgrading it to a partial-totals claim', () => {
    fc.assert(
      fc.property(indexArb, fc.integer({ min: 1, max: 30 }), (index, cap) => {
        const { perDs } = computeImpactTotals(index, { cap, sourceCapped: false })

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
