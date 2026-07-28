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
