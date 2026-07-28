import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { buildMetricsInlineFilter, toInlineSuffix } from '../metrics-filter-inline'

/**
 * Task 11.7 (Property P3) — BYTE-EQUIVALENCE golden oracle for the shared
 * Metrics-API inline filter builder (`_shared/graphql/metrics-filter-inline.js`,
 * task 11.1 / req 5.1).
 *
 * The `legacy(...)` function below re-implements the pre-refactor inline builder
 * VERBATIM — the exact fragment/declaration/variable construction the five
 * Metrics-routed sites in `load-events-aggregation.js` inlined before 11.1. The
 * PBT (fast-check, ≥100 iters) asserts the extracted `buildMetricsInlineFilter`
 * produces a deep-equal `{ fragments, declarations, variables }` for every
 * randomized filter — preserving every recon-flagged nuance:
 *   - `or` is DROPPED (Metrics route never renders it),
 *   - `and` scalars typed Int/String, `in` arrays string-normalized then typed,
 *   - `{ value }` unwrapping on `in` entries,
 *   - `<key>In` suffixing (no double-suffix),
 *   - the optional `skipStatus` variant (status/default/kpis sites skip; the
 *     request-method / cache-status sites keep).
 *
 * If the extraction drifts from the legacy output for ANY input class, the
 * property breaks. This is the equality oracle P3 requires for 11.1.
 */

// ── Verbatim pre-refactor inline builder (the oracle) ───────────────────────
function legacyInferArrayType(arr) {
  if (!Array.isArray(arr) || !arr.length) return '[String]'
  const sample = arr[0]
  if (typeof sample === 'number') return Number.isInteger(sample) ? '[Int]' : '[Float]'
  return '[String]'
}

function legacyNormalizeIn(values) {
  if (!Array.isArray(values)) return values
  return values.map((item) => {
    const raw = item?.value !== undefined ? item.value : item
    return String(raw)
  })
}

function legacy(filters = {}, { skipStatus = false } = {}) {
  const fragments = []
  const declarations = []
  const variables = {}

  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    if (skipStatus && key.startsWith('status')) return
    const varName = `filter_${key}`
    variables[varName] = value
    fragments.push(`${key}: $${varName}`)
    declarations.push(`$${varName}: ${typeof value === 'number' ? 'Int' : 'String'}`)
  })

  Object.entries(filters?.in || {}).forEach(([key, value]) => {
    if (skipStatus && key.startsWith('status')) return
    const varName = `in_${key}`
    const normalized = legacyNormalizeIn(value)
    variables[varName] = normalized
    const gqlKey = key.endsWith('In') ? key : `${key}In`
    fragments.push(`${gqlKey}: $${varName}`)
    declarations.push(`$${varName}: ${legacyInferArrayType(normalized)}`)
  })

  return { fragments, declarations, variables }
}

// ── Arbitraries — cover scalar/array, {value} wrappers, status* keys, `or` ──
const arbAndKey = fc.oneof(
  fc.constantFrom('host', 'edgeFunctionId', 'scheme', 'requestMethod'),
  fc.constantFrom('statusGte', 'statusLte', 'status'),
  fc.string({ minLength: 1, maxLength: 6 })
)
const arbAndVal = fc.oneof(fc.string(), fc.integer(), fc.double({ noNaN: true }))
const arbInKey = fc.oneof(
  fc.constantFrom('scheme', 'host', 'statusCode', 'ratio', 'hostIn', 'statusIn'),
  fc.string({ minLength: 1, maxLength: 6 })
)
const arbInEntry = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.double({ noNaN: true }),
  fc.record({ value: fc.oneof(fc.string(), fc.integer()) })
)

const arbFilter = fc.record(
  {
    and: fc.dictionary(arbAndKey, arbAndVal, { maxKeys: 5 }),
    in: fc.dictionary(arbInKey, fc.array(arbInEntry, { maxLength: 5 }), { maxKeys: 4 }),
    or: fc.option(
      fc.array(fc.record({ and: fc.dictionary(arbAndKey, arbAndVal) }), { maxLength: 3 }),
      { nil: undefined }
    )
  },
  { requiredKeys: [] }
)

describe('P3 golden · buildMetricsInlineFilter is byte-equivalent to legacy inline (11.1)', () => {
  it('deep-equals the verbatim legacy builder — skipStatus off (≥100 iters)', () => {
    fc.assert(
      fc.property(arbFilter, (filters) => {
        expect(buildMetricsInlineFilter(filters)).toEqual(legacy(filters))
      }),
      { numRuns: 200 }
    )
  })

  it('deep-equals the verbatim legacy builder — skipStatus on (≥100 iters)', () => {
    fc.assert(
      fc.property(arbFilter, (filters) => {
        expect(buildMetricsInlineFilter(filters, { skipStatus: true })).toEqual(
          legacy(filters, { skipStatus: true })
        )
      }),
      { numRuns: 200 }
    )
  })

  it('never renders an `or` group regardless of skipStatus (Metrics-route invariant)', () => {
    fc.assert(
      fc.property(arbFilter, fc.boolean(), (filters, skipStatus) => {
        const result = buildMetricsInlineFilter(filters, { skipStatus })
        const serialized = JSON.stringify(result)
        expect(serialized).not.toContain('"or"')
      }),
      { numRuns: 200 }
    )
  })

  it('tolerates null/undefined identically to legacy', () => {
    expect(buildMetricsInlineFilter(undefined)).toEqual(legacy(undefined))
    expect(buildMetricsInlineFilter(null)).toEqual(legacy(null))
  })
})

describe('P3 golden · toInlineSuffix is byte-equivalent to the legacy idiom (11.1)', () => {
  const legacySuffix = (parts) => (parts.length ? `, ${parts.join(', ')}` : '')

  it('matches `length ? ", " + join : ""` for every parts array (≥100 iters)', () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { maxLength: 8 }), (parts) => {
        expect(toInlineSuffix(parts)).toBe(legacySuffix(parts))
      }),
      { numRuns: 200 }
    )
  })
})
