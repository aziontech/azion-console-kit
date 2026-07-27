/**
 * Security: `?filters=` GraphQL structure-injection guard.
 *
 * The filter clauses that seed a query are rehydrated from a base64 URL hash
 * (`getFiltersFromHash` → `JSON.parse(atob(...))`) with no schema validation, so
 * a tampered link can hand `buildFilter` arbitrary `{ valueField, operator }`
 * pairs. Downstream, `buildFilterGroup` forms the GraphQL query key as
 * `valueField + operator` and `buildFilterParts` splices that key verbatim into
 * the query string (`${key}: $var`). Without a guard, a crafted field/operator
 * could break out of the `filter: { ... }` block and inject structure.
 *
 * These tests pin the guard: only whitelisted operators and identifier-shaped
 * field names survive; everything else is dropped before it can reach the query.
 */
import { describe, it, expect } from 'vitest'
import { buildFilter, buildFilterGroup, VALID_OPERATORS, SAFE_FIELD_NAME } from '../build-filter'
import { buildFilterParts } from '../../build-filter-parts'

describe('buildFilterGroup — injection guard', () => {
  it('drops clauses whose operator is not in the whitelist', () => {
    const group = buildFilterGroup([
      { valueField: 'status', operator: 'Eq', value: 200, type: 'Int' },
      { valueField: 'status', operator: 'Eq) { __typename } x(', value: 1, type: 'Int' }
    ])
    expect(group).toEqual({ and: { statusEq: 200 } })
  })

  it('drops clauses whose valueField is not identifier-shaped (breakout chars)', () => {
    const group = buildFilterGroup([
      {
        valueField: 'host } evilBlock { __typename } host',
        operator: 'Eq',
        value: 'x',
        type: 'String'
      },
      { valueField: 'a: 1, injected', operator: 'Eq', value: 'x', type: 'String' },
      { valueField: 'ok', operator: 'Eq', value: 'x', type: 'String' }
    ])
    expect(group).toEqual({ and: { okEq: 'x' } })
  })

  it('drops a malicious In clause (guards the `in` branch too)', () => {
    const group = buildFilterGroup([
      { valueField: 'host) { __typename } (', operator: 'In', value: ['a'], type: 'String' }
    ])
    expect(group).toEqual({})
  })

  it('keeps every legitimate operator + identifier field unchanged', () => {
    const clauses = [...VALID_OPERATORS]
      .filter((op) => op !== 'In')
      .map((op) => ({ valueField: 'field', operator: op, value: 'v', type: 'String' }))
    const group = buildFilterGroup(clauses)
    for (const op of [...VALID_OPERATORS].filter((item) => item !== 'In')) {
      expect(group.and[`field${op}`]).toBe('v')
    }
  })

  it('exposes a strict identifier pattern', () => {
    expect(SAFE_FIELD_NAME.test('httpUserAgent')).toBe(true)
    expect(SAFE_FIELD_NAME.test('_leading')).toBe(true)
    expect(SAFE_FIELD_NAME.test('has space')).toBe(false)
    expect(SAFE_FIELD_NAME.test('has}brace')).toBe(false)
    expect(SAFE_FIELD_NAME.test('1leading')).toBe(false)
  })
})

describe('build-filter → build-filter-parts — no query breakout end to end', () => {
  it('produces no fragment for a tampered clause, so the query cannot be broken out', () => {
    const malicious = buildFilter([
      { valueField: 'x } injected { __typename', operator: 'Eq', value: 'pwn', type: 'String' }
    ])
    const { fragments, declarations, variables } = buildFilterParts(malicious, 'flt')
    expect(fragments).toEqual([])
    expect(declarations).toEqual([])
    expect(variables).toEqual({})
  })

  it('renders a legitimate clause into a safe, parameterised fragment', () => {
    const built = buildFilter([{ valueField: 'status', operator: 'Eq', value: 200, type: 'Int' }])
    const { fragments, declarations } = buildFilterParts(built, 'flt')
    expect(fragments).toEqual(['statusEq: $flt0'])
    expect(declarations).toEqual(['$flt0: Int'])
  })
})
