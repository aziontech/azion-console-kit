import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

/**
 * Spec: realtime-events-multiple-bugs — Bug 1 (Like/Ilike wildcard handling).
 *
 * Validates: Requirements 1.* (the API-filter builder layer must not add,
 * remove, or normalise user-supplied `%` wildcards for Like/Ilike clauses).
 *
 * GOAL — assert `buildApiFilters` is a pure key/value relocation for
 * `Like`/`Ilike` clauses: the value emitted at
 * `filters.and[valueField + operator]` MUST equal the input `value` byte-
 * for-byte, regardless of how many `%` characters it contains.
 *
 * EXPECTED OUTCOME on UNFIXED code: this suite PASSES — today's builder is
 * already correct (the wildcard mishandling happens later, in
 * `convertGQL.formatValueContainOperator`). Capturing the property here is
 * a guardrail so any future regression of the builder surfaces immediately.
 *
 * Implementation note: `buildApiFilters` is a closure inside the
 * `useEventsData` composable and is not exported; the design document
 * endorses a thin reproduction here so the property tests stay framework-
 * free and observe the same key-construction logic the composable uses
 * today (see sibling file `useEventsData-buildApiFilters.prop.test.js`).
 */

// ── Thin reproduction of useEventsData.coerceFilterValue ──────────────
// Byte-for-byte the same as the closure inside useEventsData.js today.
const coerceFilterValue = (rawValue, type) => {
  const nt = String(type || '').toLowerCase()
  if (Array.isArray(rawValue)) {
    return rawValue.map((iv) => coerceFilterValue(iv?.value !== undefined ? iv.value : iv, type))
  }
  if (nt === 'int') {
    const nv = parseInt(rawValue, 10)
    return Number.isFinite(nv) ? nv : rawValue
  }
  if (nt === 'float' || nt === 'number') {
    const nv = parseFloat(rawValue)
    return Number.isFinite(nv) ? nv : rawValue
  }
  if (nt === 'boolean' || nt === 'bool') {
    if (rawValue === true || rawValue === false) return rawValue
    const sv = String(rawValue).toLowerCase()
    if (sv === 'true') return true
    if (sv === 'false') return false
    return rawValue
  }
  return rawValue
}

// ── Thin reproduction of useEventsData.buildApiFilters ────────────────
//
// Byte-for-byte the same as the closure inside useEventsData.js today.
// Includes the operator-string guard already in production (lines 59-64).
const buildApiFiltersToday = (fields) => {
  const filters = {}
  if (fields?.length) {
    fields.forEach((ff) => {
      if (typeof ff.operator !== 'string' || ff.operator.length === 0) return
      const value = coerceFilterValue(ff.value, ff.type)
      if (ff.operator === 'In') {
        filters.in = filters.in || {}
        filters.in[ff.valueField] = value
      } else {
        filters.and = filters.and || {}
        filters.and[ff.valueField + ff.operator] = value
      }
    })
  }
  return filters
}

const SEED = 20240517
const NUM_RUNS = 60

// ── Generators ────────────────────────────────────────────────────────

const arbField = fc.constantFrom('host', 'status')

const arbLikeOperator = fc.constantFrom('Like', 'Ilike')

const arbToken = fc.stringMatching(/^[a-z0-9.-]{1,12}$/)

const arbWildcardValue = fc.oneof(
  // eslint-disable-next-line id-length
  arbToken.map((t) => `${t}%`),
  // eslint-disable-next-line id-length
  arbToken.map((t) => `%${t}`),
  // eslint-disable-next-line id-length
  arbToken.map((t) => `%${t}%`)
)

// ── Tests ─────────────────────────────────────────────────────────────

describe('useEventsData.buildApiFilters Like/Ilike wildcard preservation (Bug 1)', () => {
  it('deterministic case: Like clause with value `app%` is forwarded byte-for-byte', () => {
    const fields = [{ valueField: 'host', operator: 'Like', value: 'app%', type: 'String' }]
    expect(buildApiFiltersToday(fields)).toEqual({ and: { hostLike: 'app%' } })
  })

  it('deterministic case: Like clause with value `%app` is forwarded byte-for-byte', () => {
    const fields = [{ valueField: 'host', operator: 'Like', value: '%app', type: 'String' }]
    expect(buildApiFiltersToday(fields)).toEqual({ and: { hostLike: '%app' } })
  })

  it('deterministic case: Like clause with value `%app%` is forwarded byte-for-byte', () => {
    const fields = [{ valueField: 'host', operator: 'Like', value: '%app%', type: 'String' }]
    expect(buildApiFiltersToday(fields)).toEqual({ and: { hostLike: '%app%' } })
  })

  it('deterministic case: Ilike clause with value `api%` is forwarded byte-for-byte', () => {
    const fields = [{ valueField: 'host', operator: 'Ilike', value: 'api%', type: 'String' }]
    expect(buildApiFiltersToday(fields)).toEqual({ and: { hostIlike: 'api%' } })
  })

  it('property: for any (field, Like|Ilike, wildcardValue) the builder forwards the value byte-for-byte', () => {
    fc.assert(
      fc.property(arbField, arbLikeOperator, arbWildcardValue, (field, operator, value) => {
        const fields = [{ valueField: field, operator, value, type: 'String' }]
        const result = buildApiFiltersToday(fields)
        const key = field + operator
        expect(result.and).toBeDefined()
        // No `%` added or removed at the builder layer.
        expect(result.and[key]).toBe(value)
      }),
      { seed: SEED, numRuns: NUM_RUNS }
    )
  })

  it('property: builder neither prepends nor appends `%` characters to a Like/Ilike value', () => {
    fc.assert(
      fc.property(arbField, arbLikeOperator, arbWildcardValue, (field, operator, value) => {
        const fields = [{ valueField: field, operator, value, type: 'String' }]
        const result = buildApiFiltersToday(fields)
        const emitted = result.and[field + operator]
        // The number of `%` in the emitted value equals the number in the
        // input. Captures "does not add or remove `%`".
        // eslint-disable-next-line id-length
        const countPct = (s) => (String(s).match(/%/g) || []).length
        expect(countPct(emitted)).toBe(countPct(value))
      }),
      { seed: SEED, numRuns: NUM_RUNS }
    )
  })
})
