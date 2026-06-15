import { describe, it, expect } from 'vitest'
import { buildFilterParts } from '../build-filter-parts'

describe('buildFilterParts', () => {
  it('renders a flat AND-only filter (no OR) into top-level fragments', () => {
    const { fragments, declarations, variables } = buildFilterParts(
      { and: { statusEq: 200 }, in: { configurationId: ['a', 'b'] } },
      'flt'
    )
    expect(fragments).toEqual(['statusEq: $flt0', 'configurationIdIn: $flt1'])
    expect(declarations).toEqual(['$flt0: Int', '$flt1: [String]'])
    expect(variables).toEqual({ flt0: 200, flt1: ['a', 'b'] })
  })

  it('renders an `or` group filter into a single nested fragment', () => {
    const { fragments, declarations, variables } = buildFilterParts(
      { or: [{ and: { statusEq: 200 } }, { and: { statusEq: 404 } }] },
      'flt'
    )
    expect(fragments).toEqual(['or: [ { statusEq: $flt0 }, { statusEq: $flt1 } ]'])
    expect(declarations).toEqual(['$flt0: Int', '$flt1: Int'])
    expect(variables).toEqual({ flt0: 200, flt1: 404 })
  })

  it('appends the In suffix and normalizes IN values to strings', () => {
    const { fragments, variables } = buildFilterParts({ in: { country: ['US', 'BR'] } }, 'x')
    expect(fragments).toEqual(['countryIn: $x0'])
    expect(variables.x0).toEqual(['US', 'BR'])
  })

  it('produces no fragments for an empty filter', () => {
    expect(buildFilterParts({}, 'f')).toEqual({ fragments: [], declarations: [], variables: {} })
  })
})
