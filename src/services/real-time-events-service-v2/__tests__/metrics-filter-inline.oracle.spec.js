import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Byte-equivalence oracle for the shared Metrics-API inline filter/variables
 * builder (`_shared/graphql/metrics-filter-inline.js`, task 11.1 / req 5.1).
 *
 * The five drop-`or` typed-variable builder sites in `load-events-aggregation.js`
 * (status chart, request-method chart, cache-status chart, default count path,
 * and the KPI-from-metrics path) all reimplemented the same fragment /
 * declaration / variable construction. This oracle pins the EXACT GraphQL
 * request body each site emits for a filter shape that exercises:
 *   - a scalar `and` key (String)  → `host: $filter_host`
 *   - a numeric `and` key (Int)    → `edgeFunctionId: $filter_edgeFunctionId`
 *   - an `in` key (array)          → `schemeIn: $in_scheme`
 *   - a `status*` `and` key        → skipped by the status-aware sites,
 *                                     translated into `statusRange` instead
 *   - an `or` group                → DROPPED (never rendered)
 *
 * If the extraction changes any byte of the emitted query or variables, one of
 * these snapshots breaks — which is exactly the regression guard the DRY
 * consolidation must survive.
 */

const { mockAdapterRequest } = vi.hoisted(() => ({ mockAdapterRequest: vi.fn() }))

vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: { request: mockAdapterRequest }
}))

vi.mock('../make-real-time-events-service', () => ({
  makeRealTimeEventsBaseUrl: () => 'v4/events/graphql',
  makeBeholderBaseUrl: () => 'v4/metrics/graphql'
}))

vi.mock('../../real-time-metrics-services/make-beholder-base-url', () => ({
  makeBeholderBaseUrl: () => 'v4/metrics/graphql'
}))

const { loadEventsChartAggregation, loadSummaryKpis } = await import('../load-events-aggregation')

// > 30 min → routed to the Metrics API (the paths that hold the 5 sites).
const TS_RANGE = {
  tsRangeBegin: '2024-01-01T00:00:00Z',
  tsRangeEnd: '2024-01-01T06:00:00Z'
}

// Every field here survives cleanBuiltFilterForMetrics for httpMetrics, so the
// builder actually receives them. `status*` is kept by the cleaner and then
// dropped/translated by the status-aware builder sites. `or` is added to prove
// the builder ignores it (drop-`or` invariant).
const FILTERS = {
  and: { host: 'example.com', statusGte: 400 },
  in: { scheme: [{ value: 'https' }, { value: 'http' }] },
  or: [{ and: { host: 'ignored.com' } }]
}

const okResponse = { statusCode: 200, body: { data: {} } }

const lastBody = () => JSON.parse(mockAdapterRequest.mock.calls.at(-1)[0].body)

beforeEach(() => {
  mockAdapterRequest.mockReset()
  mockAdapterRequest.mockResolvedValue(okResponse)
})

describe('metrics-filter-inline oracle · byte-equivalent request bodies', () => {
  it('status chart path (skips status*, keeps host/scheme, drops or)', async () => {
    await loadEventsChartAggregation({
      dataset: 'workloadEvents',
      tsRange: TS_RANGE,
      filters: FILTERS,
      groupByField: 'status'
    })
    expect(lastBody()).toMatchSnapshot()
  })

  it('request-method chart path (no status skip, drops or)', async () => {
    await loadEventsChartAggregation({
      dataset: 'workloadEvents',
      tsRange: TS_RANGE,
      filters: FILTERS,
      groupByField: 'requestMethod'
    })
    expect(lastBody()).toMatchSnapshot()
  })

  it('cache-status chart path (no status skip, drops or)', async () => {
    await loadEventsChartAggregation({
      dataset: 'workloadEvents',
      tsRange: TS_RANGE,
      filters: FILTERS,
      groupByField: 'upstreamCacheStatus'
    })
    expect(lastBody()).toMatchSnapshot()
  })

  it('default count path (skips status*, drops or)', async () => {
    await loadEventsChartAggregation({
      dataset: 'workloadEvents',
      tsRange: TS_RANGE,
      filters: FILTERS,
      groupByField: null
    })
    expect(lastBody()).toMatchSnapshot()
  })

  it('summary-kpis-from-metrics path (skips status*, drops or)', async () => {
    await loadSummaryKpis({
      dataset: 'workloadEvents',
      tsRange: TS_RANGE,
      filters: FILTERS
    })
    expect(lastBody()).toMatchSnapshot()
  })
})
