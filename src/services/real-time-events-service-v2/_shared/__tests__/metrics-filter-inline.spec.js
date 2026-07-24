/* eslint-disable xss/no-mixed-html -- jsdom test harness: Vue stub templates + layout-spy setup, not HTML sinks */
import { describe, it, expect } from 'vitest'
import { buildMetricsInlineFilter, toInlineSuffix } from '../graphql/metrics-filter-inline'

describe('buildMetricsInlineFilter', () => {
  it('renders scalar `and` keys as filter_<key> with Int/String typing', () => {
    const result = buildMetricsInlineFilter({
      and: { host: 'example.com', edgeFunctionId: 42 }
    })
    expect(result.fragments).toEqual([
      'host: $filter_host',
      'edgeFunctionId: $filter_edgeFunctionId'
    ])
    expect(result.declarations).toEqual(['$filter_host: String', '$filter_edgeFunctionId: Int'])
    expect(result.variables).toEqual({ filter_host: 'example.com', filter_edgeFunctionId: 42 })
  })

  it('renders `in` keys as <key>In with in_<key> vars, normalizing {value} wrappers', () => {
    const result = buildMetricsInlineFilter({
      in: { scheme: [{ value: 'https' }, 'http'] }
    })
    expect(result.fragments).toEqual(['schemeIn: $in_scheme'])
    expect(result.declarations).toEqual(['$in_scheme: [String]'])
    expect(result.variables).toEqual({ in_scheme: ['https', 'http'] })
  })

  it('does not double-suffix keys already ending in In', () => {
    const result = buildMetricsInlineFilter({ in: { hostIn: ['a'] } })
    expect(result.fragments).toEqual(['hostIn: $in_hostIn'])
  })

  it('always types `in` arrays as [String] (values are string-normalized first)', () => {
    // normalizeInFilterValues coerces every entry to a string before the type
    // is inferred, so numeric inputs still yield [String] — matching the legacy
    // inline builders byte-for-byte.
    expect(buildMetricsInlineFilter({ in: { statusCode: [200, 404] } }).declarations).toEqual([
      '$in_statusCode: [String]'
    ])
    expect(buildMetricsInlineFilter({ in: { ratio: [1.5] } }).declarations).toEqual([
      '$in_ratio: [String]'
    ])
    expect(buildMetricsInlineFilter({ in: { scheme: [{ value: 'https' }] } }).variables).toEqual({
      in_scheme: ['https']
    })
  })

  it('DROPS the `or` group entirely (the Metrics-route invariant)', () => {
    const result = buildMetricsInlineFilter({
      and: { host: 'kept.com' },
      or: [{ and: { host: 'dropped.com' } }]
    })
    expect(result.fragments).toEqual(['host: $filter_host'])
    expect(result.variables).toEqual({ filter_host: 'kept.com' })
    expect(JSON.stringify(result)).not.toContain('dropped.com')
    expect(JSON.stringify(result)).not.toContain('or')
  })

  it('skipStatus omits status* keys (translated to statusRange by callers)', () => {
    const result = buildMetricsInlineFilter(
      { and: { statusGte: 400, host: 'x.com' }, in: { statusIn: [500] } },
      { skipStatus: true }
    )
    expect(result.fragments).toEqual(['host: $filter_host'])
    expect(result.variables).toEqual({ filter_host: 'x.com' })
  })

  it('without skipStatus, status* keys are kept', () => {
    const result = buildMetricsInlineFilter({ and: { statusGte: 400 } })
    expect(result.fragments).toEqual(['statusGte: $filter_statusGte'])
    expect(result.declarations).toEqual(['$filter_statusGte: Int'])
  })

  it('tolerates a null/undefined filter', () => {
    expect(buildMetricsInlineFilter(undefined)).toEqual({
      fragments: [],
      declarations: [],
      variables: {}
    })
    expect(buildMetricsInlineFilter(null)).toEqual({
      fragments: [],
      declarations: [],
      variables: {}
    })
  })
})

describe('toInlineSuffix', () => {
  it('returns empty string for no parts', () => {
    expect(toInlineSuffix([])).toBe('')
  })

  it('prefixes with ", " and joins with ", "', () => {
    expect(toInlineSuffix(['a: $a', 'b: $b'])).toBe(', a: $a, b: $b')
  })
})
