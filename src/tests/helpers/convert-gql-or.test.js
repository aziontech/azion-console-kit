import { describe, it, expect } from 'vitest'
import { convertGQL } from '@/helpers/convert-gql'

/**
 * OR support in the events list query. The events GraphQL filter accepts a
 * nested `or: [ { ... }, { ... } ]`; clauses are split into AND-groups at each
 * OR connector (SQL precedence: AND binds tighter than OR).
 */
describe('convertGQL — OR composition', () => {
  const table = {
    dataset: 'workloadEvents',
    limit: 1000,
    orderBy: 'ts_DESC',
    fields: ['ts', 'status']
  }
  const tsRange = { tsRangeBegin: '2026-06-12T15:41:04Z', tsRangeEnd: '2026-06-12T15:46:04Z' }

  it('renders `or: [ ... ]` for same-field OR clauses with correct scalar types', () => {
    const { query, variables } = convertGQL(
      {
        tsRange,
        fields: [
          { valueField: 'status', operator: 'Eq', value: 200, type: 'Int' },
          { valueField: 'status', operator: 'Eq', value: 404, type: 'Int', logicalOperator: 'OR' }
        ]
      },
      table
    )
    expect(query).toContain('or: [ { statusEq: $or0_statusEq }, { statusEq: $or1_statusEq } ]')
    expect(query).toContain('$or0_statusEq: Int!')
    expect(query).toContain('$or1_statusEq: Int!')
    expect(variables.or0_statusEq).toBe(200)
    expect(variables.or1_statusEq).toBe(404)
  })

  it('groups by SQL precedence: a AND b OR c ⇒ or: [ { a, b }, { c } ]', () => {
    const { query } = convertGQL(
      {
        tsRange,
        fields: [
          { valueField: 'host', operator: 'Like', value: 'example', type: 'String' },
          { valueField: 'status', operator: 'Eq', value: 200, type: 'Int' },
          { valueField: 'status', operator: 'Eq', value: 404, type: 'Int', logicalOperator: 'OR' }
        ]
      },
      table
    )
    expect(query).toContain(
      'or: [ { hostLike: $or0_hostLike, statusEq: $or0_statusEq }, { statusEq: $or1_statusEq } ]'
    )
    // tsRange stays ANDed at the top level.
    expect(query).toContain('tsRange: { begin: $tsRange_begin, end: $tsRange_end }')
  })

  it('is byte-identical to the flat filter when no OR connector is present', () => {
    const { query } = convertGQL(
      {
        tsRange,
        fields: [{ valueField: 'status', operator: 'Eq', value: 200, type: 'Int' }]
      },
      table
    )
    expect(query).not.toContain('or: [')
    expect(query).toContain('statusEq: $and_statusEq')
  })
})
