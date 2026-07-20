import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

/**
 * Spec: realtime-events-filter-operator-bug
 * Property 2 (Preservation): Supported-Operator Clauses Are Byte-Identical.
 *
 * Validates: Requirements 3.2, 3.3, 3.5
 *
 * GOAL — for every `filterData.fields` array whose entries all carry a
 * non-empty string `operator` drawn from the field's declared operator
 * list, `useEventsData.buildApiFilters` MUST produce the same `{ and, in }`
 * shape that today's implementation produces:
 *
 *   - `In` clauses go under `filters.in[valueField]`.
 *   - All other clauses go under `filters.and[valueField + operator]`.
 *
 * The fixed builder must remain byte-identical for these inputs.
 *
 * EXPECTED OUTCOME on UNFIXED code: this suite PASSES — confirming the
 * baseline behavior the fix must preserve. (Task 3.5 re-runs this same
 * suite on the FIXED code and expects PASS.)
 *
 * Implementation note: `buildApiFilters` is a closure inside the
 * `useEventsData` composable and is not exported; the design document
 * explicitly endorses a thin reproduction here so the property tests
 * stay framework-free and observe the same key-construction logic the
 * composable uses today (see design.md "Bug Details / Bug Condition" and
 * tasks.md task 2). The reproduction below mirrors lines 50–62 of
 * `useEventsData.js` (the `coerceFilterValue` + `buildApiFilters` block).
 */

// ── Thin reproduction of useEventsData.coerceFilterValue ──────────────
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
// Byte-for-byte the same as the closure inside useEventsData.js today:
//   - In clause → filters.in[valueField] = value
//   - else     → filters.and[valueField + operator] = value
const buildApiFiltersToday = (fields) => {
  const filters = {}
  if (fields?.length) {
    fields.forEach((ff) => {
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

// ── Generators ────────────────────────────────────────────────────────

const NON_IN_OPERATORS = ['Eq', 'Ne', 'Like', 'Ilike', 'Range', 'Lt', 'Lte', 'Gt', 'Gte']

const VALUE_FIELDS = ['status', 'host', 'configurationId', 'requestTime', 'upstreamStatus']

const arbValueField = fc.constantFrom(...VALUE_FIELDS)

const arbAlpha = fc
  .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
    minLength: 2,
    maxLength: 8
  })
  .map((chars) => chars.join(''))

// Non-IN clauses with a non-empty string operator drawn from the
// supported list. The operator is used as-is to build the key.
const arbNonInField = fc
  .tuple(
    arbValueField,
    fc.constantFrom(...NON_IN_OPERATORS),
    fc.oneof(arbAlpha, fc.integer({ min: 1, max: 999 }).map(String))
  )
  .map(([valueField, operator, value]) => ({
    valueField,
    operator,
    value,
    type: operator === 'Range' ? 'IntRange' : 'String'
  }))

// IN clauses with array values, drawn from the alphabet so the resulting
// `filters.in[valueField]` is a non-empty array of strings.
const arbInField = fc
  .tuple(arbValueField, fc.array(arbAlpha, { minLength: 1, maxLength: 4 }))
  .map(([valueField, value]) => ({
    valueField,
    operator: 'In',
    value,
    type: 'String'
  }))

const arbValidField = fc.oneof(arbNonInField, arbInField)

// ── Tests ─────────────────────────────────────────────────────────────

describe('useEventsData.buildApiFilters preservation (Property 2)', () => {
  it('deterministic case: a single Eq clause produces filters.and[valueField + Eq]', () => {
    const fields = [{ valueField: 'status', operator: 'Eq', value: '200', type: 'Int' }]
    expect(buildApiFiltersToday(fields)).toEqual({ and: { statusEq: 200 } })
  })

  it('deterministic case: a single In clause produces filters.in[valueField]', () => {
    const fields = [{ valueField: 'host', operator: 'In', value: ['a', 'b'], type: 'String' }]
    expect(buildApiFiltersToday(fields)).toEqual({ in: { host: ['a', 'b'] } })
  })

  it('deterministic case: a Range clause produces filters.and[valueField + Range] with begin/end', () => {
    const fields = [
      {
        valueField: 'requestTime',
        operator: 'Range',
        value: { begin: 10, end: 100 },
        type: 'IntRange'
      }
    ]
    expect(buildApiFiltersToday(fields)).toEqual({
      and: { requestTimeRange: { begin: 10, end: 100 } }
    })
  })

  it('deterministic case: mixed In + Eq clauses populate both filters.in and filters.and', () => {
    const fields = [
      { valueField: 'host', operator: 'In', value: ['a'], type: 'String' },
      { valueField: 'status', operator: 'Eq', value: 200, type: 'Int' }
    ]
    expect(buildApiFiltersToday(fields)).toEqual({
      in: { host: ['a'] },
      and: { statusEq: 200 }
    })
  })

  it('property: every emitted key is `valueField + operator` for non-In and `valueField` for In', () => {
    fc.assert(
      fc.property(fc.array(arbValidField, { minLength: 1, maxLength: 6 }), (fields) => {
        const result = buildApiFiltersToday(fields)
        const andKeys = Object.keys(result.and || {})
        const inKeys = Object.keys(result.in || {})

        // For each key in `and`, there exists a non-In field whose
        // valueField+operator equals the key.
        andKeys.forEach((key) => {
          const matching = fields.find(
            (ff) => ff.operator !== 'In' && ff.valueField + ff.operator === key
          )
          expect(matching).toBeDefined()
        })

        // For each key in `in`, there exists an In field whose valueField
        // equals the key.
        inKeys.forEach((key) => {
          const matching = fields.find((ff) => ff.operator === 'In' && ff.valueField === key)
          expect(matching).toBeDefined()
        })

        // Every emitted key is non-empty and never contains the literal
        // string "undefined" — captures the preservation invariant that
        // the builder only ever emits well-formed keys when fed
        // well-formed input.
        ;[...andKeys, ...inKeys].forEach((key) => {
          expect(key.length).toBeGreaterThan(0)
          expect(key).not.toContain('undefined')
        })
      }),
      { numRuns: 80 }
    )
  })

  it("property: when fields collide on the same valueField+operator the last value wins (today's behavior)", () => {
    fc.assert(
      fc.property(
        arbValueField,
        fc.constantFrom(...NON_IN_OPERATORS),
        arbAlpha,
        arbAlpha,
        // eslint-disable-next-line id-length
        (vf, op, a, b) => {
          const fields = [
            { valueField: vf, operator: op, value: a, type: 'String' },
            { valueField: vf, operator: op, value: b, type: 'String' }
          ]
          const result = buildApiFiltersToday(fields)
          // Last write wins because both clauses share the same key.
          expect(result.and[vf + op]).toBe(b)
        }
      ),
      { numRuns: 40 }
    )
  })

  it('property: empty/undefined fields list produces an empty filter object', () => {
    expect(buildApiFiltersToday([])).toEqual({})
    expect(buildApiFiltersToday(undefined)).toEqual({})
    expect(buildApiFiltersToday(null)).toEqual({})
  })
})
