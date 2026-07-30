/**
 * Task 3.3 — Metrics filter adapters.
 *
 * Covers:
 *   - `cleanBuiltFilterForMetrics` (events→metrics route): byte-equivalent to
 *     the legacy local `filterForMetrics` — `.or` untouched, `status*` kept,
 *     unsupported `and`/`in` dropped, `partial` iff any events-applicable key
 *     dropped.
 *   - `buildForTarget` (metrics-VIEW route): supported-or-drop, no lossy
 *     operator remap, `droppedFields`/`partial` correct, and PBT that no
 *     unsupported field ever survives.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { cleanBuiltFilterForMetrics, buildForTarget } from '../adapters'
import { isFieldSupported, extractBaseField, METRICS_FILTER_FIELDS } from '../field-capability'

/**
 * Local re-implementation of the legacy `load-events-aggregation.filterForMetrics`
 * used as an oracle for byte-equivalence.
 */
function legacyFilterForMetrics(filters, metricsDataset) {
  const allowed = METRICS_FILTER_FIELDS[metricsDataset]
  if (!allowed) return { cleaned: filters, partial: false }
  let partial = false
  const cleaned = {}
  if (filters?.and) {
    const kept = {}
    Object.entries(filters.and).forEach(([key, value]) => {
      if (allowed.has(extractBaseField(key))) kept[key] = value
      else partial = true
    })
    if (Object.keys(kept).length) cleaned.and = kept
  }
  if (filters?.in) {
    const kept = {}
    Object.entries(filters.in).forEach(([key, value]) => {
      if (allowed.has(extractBaseField(key))) kept[key] = value
      else partial = true
    })
    if (Object.keys(kept).length) cleaned.in = kept
  }
  return { cleaned, partial }
}

describe('cleanBuiltFilterForMetrics', () => {
  it('returns filter untouched with partial=false for unknown dataset', () => {
    const filter = { and: { statusEq: 200 }, or: [{ and: { hostEq: 'x' } }] }
    expect(cleanBuiltFilterForMetrics(filter, 'nopeDataset')).toEqual({
      cleaned: filter,
      partial: false
    })
  })

  it('keeps supported and/in keys, drops unsupported and flags partial', () => {
    const filter = {
      and: { statusGte: 200, httpUserAgentEq: 'curl' },
      in: { hostIn: ['a'], requestUriIn: ['/x'] }
    }
    const { cleaned, partial } = cleanBuiltFilterForMetrics(filter, 'httpMetrics')
    expect(cleaned).toEqual({ and: { statusGte: 200 }, in: { hostIn: ['a'] } })
    expect(partial).toBe(true)
  })

  it('preserves status* keys for httpMetrics (status is registered)', () => {
    const filter = { and: { statusGte: 200, statusLt: 300 } }
    const { cleaned, partial } = cleanBuiltFilterForMetrics(filter, 'httpMetrics')
    expect(cleaned).toEqual({ and: { statusGte: 200, statusLt: 300 } })
    expect(partial).toBe(false)
  })

  it('leaves .or untouched (never copied into cleaned, matching legacy)', () => {
    const filter = { and: { statusEq: 200 }, or: [{ and: { hostEq: 'x' } }] }
    const { cleaned } = cleanBuiltFilterForMetrics(filter, 'httpMetrics')
    expect('or' in cleaned).toBe(false)
  })

  it('omits an and/in group entirely when no key survives', () => {
    const filter = { and: { httpUserAgentEq: 'curl' }, in: { requestUriIn: ['/x'] } }
    const { cleaned, partial } = cleanBuiltFilterForMetrics(filter, 'httpMetrics')
    expect(cleaned).toEqual({})
    expect(partial).toBe(true)
  })

  it('is byte-equivalent to the legacy filterForMetrics (PBT)', () => {
    const datasets = Object.keys(METRICS_FILTER_FIELDS).concat(['nopeDataset'])
    const keyArb = fc.constantFrom(
      'statusEq',
      'statusGte',
      'statusLt',
      'hostEq',
      'hostIn',
      'requestMethodEq',
      'httpUserAgentEq',
      'requestUriIn',
      'remoteAddressEq',
      'schemeEq'
    )
    const groupArb = fc.dictionary(keyArb, fc.oneof(fc.integer(), fc.string()))
    const inGroupArb = fc.dictionary(keyArb, fc.array(fc.string()))
    const filterArb = fc.record(
      {
        and: groupArb,
        in: inGroupArb,
        or: fc.array(fc.record({ and: groupArb }))
      },
      { requiredKeys: [] }
    )
    fc.assert(
      fc.property(filterArb, fc.constantFrom(...datasets), (filter, dataset) => {
        expect(cleanBuiltFilterForMetrics(filter, dataset)).toEqual(
          legacyFilterForMetrics(filter, dataset)
        )
      }),
      { numRuns: 200 }
    )
  })
})

describe('buildForTarget', () => {
  const httpTarget = { api: 'metrics', dataset: 'httpMetrics' }

  it('returns empty result for empty/invalid fields', () => {
    expect(buildForTarget([], httpTarget)).toEqual({
      filter: {},
      droppedFields: [],
      partial: false
    })
    expect(buildForTarget(null, httpTarget)).toEqual({
      filter: {},
      droppedFields: [],
      partial: false
    })
  })

  it('keeps supported fields and builds the {and,in} shape', () => {
    const fields = [
      { valueField: 'status', operator: 'Gte', value: '200', type: 'int' },
      { valueField: 'host', operator: 'In', value: ['a', 'b'], type: 'string' }
    ]
    const { filter, droppedFields, partial } = buildForTarget(fields, httpTarget)
    expect(filter).toEqual({ and: { statusGte: 200 }, in: { host: ['a', 'b'] } })
    expect(droppedFields).toEqual([])
    expect(partial).toBe(false)
  })

  it('drops unsupported fields, reports them, flags partial', () => {
    const fields = [
      { valueField: 'status', operator: 'Eq', value: '200', type: 'int' },
      { valueField: 'httpUserAgent', operator: 'Eq', value: 'curl', type: 'string' }
    ]
    const { filter, droppedFields, partial } = buildForTarget(fields, httpTarget)
    expect(filter).toEqual({ and: { statusEq: 200 } })
    expect(droppedFields).toEqual(['httpUserAgent'])
    expect(partial).toBe(true)
  })

  it('drops everything for an unregistered dataset (conservative default)', () => {
    const fields = [{ valueField: 'status', operator: 'Eq', value: '200', type: 'int' }]
    const { filter, droppedFields, partial } = buildForTarget(fields, {
      api: 'metrics',
      dataset: 'nope'
    })
    expect(filter).toEqual({})
    expect(droppedFields).toEqual(['status'])
    expect(partial).toBe(true)
  })

  it('no unsupported field ever survives into the built filter (PBT)', () => {
    const target = { api: 'metrics', dataset: 'httpMetrics' }
    const fieldArb = fc.record({
      valueField: fc.constantFrom(
        'status',
        'host',
        'requestMethod',
        'httpUserAgent',
        'requestUri',
        'remoteAddress',
        'scheme',
        'bytesSent'
      ),
      operator: fc.constantFrom('Eq', 'Gte', 'Lt', 'In'),
      value: fc.oneof(fc.string(), fc.array(fc.string())),
      type: fc.constantFrom('string', 'int', 'float')
    })
    fc.assert(
      fc.property(fc.array(fieldArb), (fields) => {
        const { filter } = buildForTarget(fields, target)
        const collect = (group) => Object.keys(group || {})
        const keys = [...collect(filter.and), ...collect(filter.in)]
        keys.forEach((key) => {
          expect(isFieldSupported(key, target)).toBe(true)
        })
      }),
      { numRuns: 200 }
    )
  })

  it('partial=true iff at least one field dropped (PBT)', () => {
    const target = { api: 'metrics', dataset: 'httpMetrics' }
    const fieldArb = fc.record({
      valueField: fc.constantFrom('status', 'host', 'httpUserAgent', 'requestUri'),
      operator: fc.constantFrom('Eq', 'In'),
      value: fc.string(),
      type: fc.constant('string')
    })
    fc.assert(
      fc.property(fc.array(fieldArb, { minLength: 1 }), (fields) => {
        const { droppedFields, partial } = buildForTarget(fields, target)
        expect(partial).toBe(droppedFields.length > 0)
      }),
      { numRuns: 200 }
    )
  })
})
