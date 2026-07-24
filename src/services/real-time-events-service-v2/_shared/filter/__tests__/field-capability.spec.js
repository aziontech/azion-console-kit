/**
 * Task 3.7 — field capability + conservative default.
 *
 * Property 4 (design §Properties): no unsupported field survives into a metrics
 * query — enforced here at the `isFieldSupported` gate that `buildForTarget`
 * relies on. Validates: Requirements 5.1, 6.2, 6.3.
 *
 * Focus: the CONSERVATIVE DEFAULT — an unknown field / unregistered dataset is
 * treated as NOT supported so the code never emits a key the Metrics API would
 * reject; and `resolveCapabilityTarget` resolving the dataset from the four
 * `METRICS_CHART_CONFIGS` shapes. Adapter-level PBT (keeps supported / drops
 * unsupported / partial) lives in `adapters.spec.js`.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  isFieldSupported,
  extractBaseField,
  resolveCapabilityTarget,
  METRICS_FILTER_FIELDS
} from '../field-capability'

describe('extractBaseField', () => {
  it('strips a trailing operator suffix, yielding the base field', () => {
    expect(extractBaseField('statusGte')).toBe('status')
    expect(extractBaseField('hostIn')).toBe('host')
    expect(extractBaseField('requestTimeRange')).toBe('requestTime')
    expect(extractBaseField('schemeEq')).toBe('scheme')
    expect(extractBaseField('host')).toBe('host') // no suffix
  })
})

describe('isFieldSupported — events target', () => {
  it('accepts every field for events (or missing target)', () => {
    expect(isFieldSupported('httpUserAgentEq', { api: 'events' })).toBe(true)
    expect(isFieldSupported('anythingAtAll', undefined)).toBe(true)
    expect(isFieldSupported('anythingAtAll', null)).toBe(true)
  })
})

describe('isFieldSupported — metrics target (conservative default)', () => {
  it('accepts a registered base field regardless of operator suffix', () => {
    const target = { api: 'metrics', dataset: 'httpMetrics' }
    expect(isFieldSupported('status', target)).toBe(true)
    expect(isFieldSupported('statusGte', target)).toBe(true)
    expect(isFieldSupported('hostIn', target)).toBe(true)
    expect(isFieldSupported('wafBlockEq', target)).toBe(true)
  })

  it('rejects a field not registered for the dataset', () => {
    const target = { api: 'metrics', dataset: 'httpMetrics' }
    expect(isFieldSupported('httpUserAgent', target)).toBe(false)
    expect(isFieldSupported('requestUriIn', target)).toBe(false)
    expect(isFieldSupported('remoteAddressEq', target)).toBe(false)
  })

  it('rejects EVERYTHING for an unknown/unregistered dataset (conservative)', () => {
    const target = { api: 'metrics', dataset: 'nopeDataset' }
    expect(isFieldSupported('status', target)).toBe(false)
    expect(isFieldSupported('host', target)).toBe(false)
  })

  it('rejects when dataset is missing on a metrics target (conservative)', () => {
    expect(isFieldSupported('status', { api: 'metrics' })).toBe(false)
    expect(isFieldSupported('status', { api: 'metrics', dataset: undefined })).toBe(false)
  })

  it('rejects for an unrecognized api value (conservative)', () => {
    expect(isFieldSupported('status', { api: 'other' })).toBe(false)
  })

  it('conservative default holds for any field name on an unregistered dataset (PBT)', () => {
    const knownDatasets = Object.keys(METRICS_FILTER_FIELDS)
    fc.assert(
      fc.property(
        fc.string(),
        fc.string().filter((candidate) => !knownDatasets.includes(candidate)),
        (field, dataset) => {
          expect(isFieldSupported(field, { api: 'metrics', dataset })).toBe(false)
        }
      ),
      { numRuns: 200 }
    )
  })

  it('a registered field is supported iff its base is in the dataset set (PBT)', () => {
    const datasetArb = fc.constantFrom(...Object.keys(METRICS_FILTER_FIELDS))
    const suffixArb = fc.constantFrom(
      '',
      'Eq',
      'Ne',
      'Gte',
      'Gt',
      'Lte',
      'Lt',
      'Like',
      'In',
      'Range'
    )
    const baseArb = fc.constantFrom(
      'status',
      'host',
      'scheme',
      'requestMethod',
      'bytesSent',
      'httpUserAgent', // never registered — always dropped
      'requestUri', // never registered — always dropped
      'remoteAddress' // never registered — always dropped
    )
    fc.assert(
      fc.property(datasetArb, baseArb, suffixArb, (dataset, base, suffix) => {
        const target = { api: 'metrics', dataset }
        const expected = METRICS_FILTER_FIELDS[dataset].has(base)
        // `Range`/`In` suffixes must not change the base-field decision.
        expect(isFieldSupported(base + suffix, target)).toBe(expected)
      }),
      { numRuns: 300 }
    )
  })
})

describe('resolveCapabilityTarget — dataset resolution from the 4 config shapes', () => {
  it('1. metricsApiSeries.metricsDataset takes precedence', () => {
    const config = {
      metricsApiSeries: { metricsDataset: 'httpMetrics' },
      eventsApi: {},
      metricsApiFallback: { metricsDataset: 'l2CacheMetrics' },
      metricsDataset: 'idnsQueriesMetrics'
    }
    expect(resolveCapabilityTarget(config)).toEqual({ api: 'metrics', dataset: 'httpMetrics' })
  })

  it('2. eventsApi present ⇒ metricsApiFallback.metricsDataset', () => {
    const config = {
      eventsApi: {},
      metricsApiFallback: { metricsDataset: 'l2CacheMetrics' },
      metricsDataset: 'idnsQueriesMetrics'
    }
    expect(resolveCapabilityTarget(config)).toEqual({ api: 'metrics', dataset: 'l2CacheMetrics' })
  })

  it('3. no eventsApi ⇒ falls through to config.metricsDataset', () => {
    const config = {
      metricsApiFallback: { metricsDataset: 'l2CacheMetrics' },
      metricsDataset: 'idnsQueriesMetrics'
    }
    expect(resolveCapabilityTarget(config)).toEqual({
      api: 'metrics',
      dataset: 'idnsQueriesMetrics'
    })
  })

  it('4. plain config.metricsDataset (default aggregation path)', () => {
    expect(resolveCapabilityTarget({ metricsDataset: 'dataStreamedMetrics' })).toEqual({
      api: 'metrics',
      dataset: 'dataStreamedMetrics'
    })
  })

  it('undefined dataset when nothing resolves (feeds conservative default)', () => {
    expect(resolveCapabilityTarget({})).toEqual({ api: 'metrics', dataset: undefined })
    expect(resolveCapabilityTarget(null)).toEqual({ api: 'metrics', dataset: undefined })
    // and that unresolved target rejects every field:
    const target = resolveCapabilityTarget({})
    expect(isFieldSupported('status', target)).toBe(false)
  })
})
