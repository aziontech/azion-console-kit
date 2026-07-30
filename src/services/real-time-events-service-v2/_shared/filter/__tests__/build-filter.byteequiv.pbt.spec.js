/**
 * Task 3.6 — PBT byte-equivalence: `buildFilter` vs the legacy `buildApiFilters`.
 *
 * Property 3 (design §Properties): the extracted `buildFilter` produces a filter
 * `{ and, in, or }` byte-for-byte identical to the inline `buildApiFilters` body
 * that previously lived in `useEventsData`.
 * Validates: Requirements 5.2, 5.5.
 *
 * Strategy: a self-contained re-implementation of the legacy inline behaviour is
 * used as the oracle. Both example fixtures (flat AND, In, OR-split, mixed types,
 * empty, missing-operator) and randomized fast-check runs (≥100 iters) assert
 * deep equality between `buildFilter(fields)` and `legacyBuildApiFilters(fields)`.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { buildFilter, coerceFilterValue, buildFilterGroup } from '../build-filter'

/* ------------------------------------------------------------------------- *
 * Oracle: faithful re-implementation of the legacy inline `buildApiFilters`.
 * Kept independent from the module under test so a regression in either shows
 * up as a divergence.
 * ------------------------------------------------------------------------- */

function legacyCoerce(rawValue, type) {
  const nt = String(type || '').toLowerCase()
  if (Array.isArray(rawValue))
    return rawValue.map((iv) => legacyCoerce(iv?.value !== undefined ? iv.value : iv, type))
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

function legacyGroup(clauses) {
  const group = {}
  clauses.forEach((ff) => {
    if (typeof ff.operator !== 'string' || ff.operator.length === 0) return
    const value = legacyCoerce(ff.value, ff.type)
    if (ff.operator === 'In') {
      group.in = group.in || {}
      const existing = Array.isArray(group.in[ff.valueField]) ? group.in[ff.valueField] : []
      group.in[ff.valueField] = [...existing, ...(Array.isArray(value) ? value : [value])]
    } else {
      group.and = group.and || {}
      group.and[ff.valueField + ff.operator] = value
    }
  })
  return group
}

function legacyBuildApiFilters(fields) {
  if (!Array.isArray(fields) || !fields.length) return {}
  const hasOr = fields.some((ff) => String(ff?.logicalOperator).toUpperCase() === 'OR')
  if (!hasOr) return legacyGroup(fields)
  const groups = []
  fields.forEach((ff) => {
    if (!groups.length || String(ff?.logicalOperator).toUpperCase() === 'OR') groups.push([])
    groups[groups.length - 1].push(ff)
  })
  return { or: groups.map(legacyGroup) }
}

/* ------------------------------------------------------------------------- *
 * Example fixtures — the corpus called out by task 3.6.
 * ------------------------------------------------------------------------- */

describe('buildFilter — example fixtures', () => {
  it('empty / non-array input → {}', () => {
    expect(buildFilter([])).toEqual({})
    expect(buildFilter(null)).toEqual({})
    expect(buildFilter(undefined)).toEqual({})
    expect(buildFilter('nope')).toEqual({})
    for (const input of [[], null, undefined, 'nope'])
      expect(buildFilter(input)).toEqual(legacyBuildApiFilters(input))
  })

  it('flat AND — single group of non-In clauses', () => {
    const fields = [
      { valueField: 'status', operator: 'Eq', value: '200', type: 'int' },
      { valueField: 'host', operator: 'Like', value: 'azion.com', type: 'string' }
    ]
    expect(buildFilter(fields)).toEqual({ and: { statusEq: 200, hostLike: 'azion.com' } })
    expect(buildFilter(fields)).toEqual(legacyBuildApiFilters(fields))
  })

  it('In — accumulates into the in group, merging repeated fields', () => {
    const fields = [
      { valueField: 'host', operator: 'In', value: ['a', 'b'], type: 'string' },
      { valueField: 'host', operator: 'In', value: 'c', type: 'string' }
    ]
    expect(buildFilter(fields)).toEqual({ in: { host: ['a', 'b', 'c'] } })
    expect(buildFilter(fields)).toEqual(legacyBuildApiFilters(fields))
  })

  it('OR-split — AND binds tighter than OR (a AND b OR c ⇒ (a AND b) OR c)', () => {
    const fields = [
      { valueField: 'status', operator: 'Eq', value: '200', type: 'int' },
      { valueField: 'host', operator: 'Eq', value: 'x', type: 'string', logicalOperator: 'AND' },
      {
        valueField: 'scheme',
        operator: 'Eq',
        value: 'https',
        type: 'string',
        logicalOperator: 'OR'
      }
    ]
    expect(buildFilter(fields)).toEqual({
      or: [{ and: { statusEq: 200, hostEq: 'x' } }, { and: { schemeEq: 'https' } }]
    })
    expect(buildFilter(fields)).toEqual(legacyBuildApiFilters(fields))
  })

  it('mixed types — int/float/boolean coercion within a group', () => {
    const fields = [
      { valueField: 'status', operator: 'Gte', value: '200', type: 'int' },
      { valueField: 'requestTime', operator: 'Gt', value: '1.5', type: 'float' },
      { valueField: 'wafBlock', operator: 'Eq', value: 'true', type: 'boolean' }
    ]
    expect(buildFilter(fields)).toEqual({
      and: { statusGte: 200, requestTimeGt: 1.5, wafBlockEq: true }
    })
    expect(buildFilter(fields)).toEqual(legacyBuildApiFilters(fields))
  })

  it('missing / non-string operator — clause is skipped (no `${field}undefined` key)', () => {
    const fields = [
      { valueField: 'status', operator: 'Eq', value: '200', type: 'int' },
      { valueField: 'host', value: 'x', type: 'string' },
      { valueField: 'scheme', operator: '', value: 'https', type: 'string' },
      { valueField: 'method', operator: 123, value: 'GET', type: 'string' }
    ]
    expect(buildFilter(fields)).toEqual({ and: { statusEq: 200 } })
    expect(buildFilter(fields)).toEqual(legacyBuildApiFilters(fields))
  })
})

/* ------------------------------------------------------------------------- *
 * Property-based byte-equivalence.
 * ------------------------------------------------------------------------- */

describe('buildFilter — PBT byte-equivalence to legacy buildApiFilters', () => {
  // A clause arbitrary spanning every dimension the corpus enumerates:
  // flat AND / In operators, mixed types, occasionally-missing operators, and
  // AND/OR logical connectors (to exercise the OR-split path).
  const clauseArb = fc.record(
    {
      valueField: fc.constantFrom('status', 'host', 'scheme', 'requestTime', 'wafBlock', 'method'),
      operator: fc.oneof(
        fc.constantFrom('Eq', 'Ne', 'Gte', 'Gt', 'Lte', 'Lt', 'Like', 'In'),
        // missing-operator dimension: undefined, empty string, non-string
        fc.constantFrom(undefined, '', 0, null)
      ),
      value: fc.oneof(
        fc.string(),
        fc.integer(),
        fc.double({ noNaN: true }),
        fc.boolean(),
        fc.array(fc.oneof(fc.string(), fc.integer())),
        // option-object arrays that coerceFilterValue must unwrap
        fc.array(fc.record({ value: fc.oneof(fc.string(), fc.integer()) }))
      ),
      type: fc.constantFrom('int', 'float', 'number', 'boolean', 'bool', 'string', ''),
      logicalOperator: fc.constantFrom('AND', 'OR', 'and', 'or', undefined)
    },
    { requiredKeys: ['valueField', 'value', 'type'] }
  )

  it('is byte-equivalent for arbitrary clause lists (≥100 iters)', () => {
    fc.assert(
      fc.property(fc.array(clauseArb, { maxLength: 12 }), (fields) => {
        expect(buildFilter(fields)).toEqual(legacyBuildApiFilters(fields))
      }),
      { numRuns: 300 }
    )
  })

  it('coerceFilterValue matches the legacy coercion (≥100 iters)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.double({ noNaN: true }),
          fc.boolean(),
          fc.array(fc.oneof(fc.string(), fc.integer(), fc.record({ value: fc.string() })))
        ),
        fc.constantFrom('int', 'float', 'number', 'boolean', 'bool', 'string', ''),
        (raw, type) => {
          expect(coerceFilterValue(raw, type)).toEqual(legacyCoerce(raw, type))
        }
      ),
      { numRuns: 300 }
    )
  })

  it('buildFilterGroup matches the legacy grouping (≥100 iters)', () => {
    fc.assert(
      fc.property(fc.array(clauseArb, { maxLength: 12 }), (clauses) => {
        expect(buildFilterGroup(clauses)).toEqual(legacyGroup(clauses))
      }),
      { numRuns: 200 }
    )
  })
})
