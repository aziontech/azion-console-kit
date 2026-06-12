/* eslint-disable no-console */
/**
 * Task 10.4* — Integration test: GraphQL Query Validation
 *
 * **Validates: Property P3 (queries in the 5 problematic datasets never
 * carry an unsupported groupBy), Requirements 2.1–2.7, N.9**
 *
 * Drives `loadEventsChartAggregation` through the Events-API path and
 * asserts:
 *   1. For each problematic dataset (functionEvents, functionConsoleEvents,
 *      dataStreamedEvents, edgeDnsQueriesEvents, activityHistoryEvents),
 *      an incoming `groupByField` is dropped before the GraphQL string
 *      is built. The query must contain `groupBy: [ts]` only.
 *   2. The unsupported field name does NOT appear in `groupBy: [...]`.
 *   3. Positive control — workloadEvents still supports
 *      `groupBy: [ts, status]` because the dataset whitelists it.
 *
 * Strategy:
 *   - Mock `AxiosHttpClientSignalDecorator` so we can intercept the
 *     outbound request body and assert on its GraphQL string.
 *   - Use a tsRange ≤ 30 minutes so `resolveChartApi` routes to the
 *     Events API (otherwise the call goes to the Metrics API, which
 *     uses a different, unmocked client).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockDecoratorRequest, MockDecoratorClass } = vi.hoisted(() => {
  const mockRequest = vi.fn()
  const MockClass = vi.fn().mockImplementation(() => ({ request: mockRequest }))
  return { mockDecoratorRequest: mockRequest, MockDecoratorClass: MockClass }
})

vi.mock('@/services/axios/AxiosHttpClientSignalDecorator', () => ({
  AxiosHttpClientSignalDecorator: MockDecoratorClass
}))

vi.mock('@/services/real-time-events-service-v2/make-real-time-events-service', () => ({
  makeRealTimeEventsBaseUrl: () => 'v4/events/graphql'
}))

const { loadEventsChartAggregation } = await import('../load-events-aggregation')

// ≤ 30 minutes → resolveChartApi returns 'events' → uses the mocked decorator.
const VALID_TS_RANGE = {
  tsRangeBegin: '2024-01-01T00:00:00Z',
  tsRangeEnd: '2024-01-01T00:15:00Z'
}

const PROBLEMATIC_DATASETS = [
  'functionEvents',
  'functionConsoleEvents',
  'dataStreamedEvents',
  'edgeDnsQueriesEvents',
  'activityHistoryEvents'
]

// Mock GraphQL response shape: the chart alias must exist for the converter
// to terminate cleanly. We don't inspect the response — only the request.
function emptyChartResponse() {
  return {
    statusCode: 200,
    body: { data: { chart: [] } }
  }
}

beforeEach(() => {
  mockDecoratorRequest.mockReset()
  MockDecoratorClass.mockClear()
  MockDecoratorClass.mockImplementation(() => ({ request: mockDecoratorRequest }))
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

// ---------------------------------------------------------------------------
// Helpers — extract the outbound GraphQL string for assertions
// ---------------------------------------------------------------------------

function getRequestBody() {
  expect(mockDecoratorRequest).toHaveBeenCalled()
  const { body } = mockDecoratorRequest.mock.calls[0][0]
  return JSON.parse(body)
}

function getQueryString() {
  return getRequestBody().query
}

// ---------------------------------------------------------------------------
// Negative cases — unsupported groupBy is dropped
// ---------------------------------------------------------------------------

describe('loadEventsChartAggregation · groupBy guard (Task 10.4*)', () => {
  describe.each(PROBLEMATIC_DATASETS)('dataset: %s', (dataset) => {
    it('drops unsupported groupByField="status" → query uses groupBy: [ts] only', async () => {
      mockDecoratorRequest.mockResolvedValueOnce(emptyChartResponse())

      await loadEventsChartAggregation({
        dataset,
        tsRange: VALID_TS_RANGE,
        filters: {},
        groupByField: 'status'
      })

      const query = getQueryString()
      // The query must group by ts only — never include the dropped field.
      expect(query).toMatch(/groupBy:\s*\[ts\]/)
      expect(query).not.toMatch(/groupBy:\s*\[ts,\s*status\]/)
      // The structured warning was logged for observability.
      expect(console.warn).toHaveBeenCalled()
    })

    it('drops arbitrary groupByField="requestMethod" → groupBy: [ts] only', async () => {
      mockDecoratorRequest.mockResolvedValueOnce(emptyChartResponse())

      await loadEventsChartAggregation({
        dataset,
        tsRange: VALID_TS_RANGE,
        filters: {},
        groupByField: 'requestMethod'
      })

      const query = getQueryString()
      expect(query).toMatch(/groupBy:\s*\[ts\]/)
      expect(query).not.toContain('requestMethod')
    })

    it('null groupByField is preserved (no warning, plain ts-only query)', async () => {
      mockDecoratorRequest.mockResolvedValueOnce(emptyChartResponse())

      await loadEventsChartAggregation({
        dataset,
        tsRange: VALID_TS_RANGE,
        filters: {},
        groupByField: null
      })

      const query = getQueryString()
      expect(query).toMatch(/groupBy:\s*\[ts\]/)
      // No warning when no groupByField was provided in the first place.
      expect(console.warn).not.toHaveBeenCalled()
    })
  })
})

// ---------------------------------------------------------------------------
// Positive control — workloadEvents still supports its whitelisted fields
// ---------------------------------------------------------------------------

describe('loadEventsChartAggregation · positive control workloadEvents (Task 10.4*)', () => {
  it('keeps groupByField="status" but emits the bucketed alias path (HTTP-like)', async () => {
    // workloadEvents with status + no explicit status filter triggers the
    // status-buckets alias path (chart2xx/chart3xx/...). The dataset DOES
    // support `status` — the guard is a pass-through here.
    mockDecoratorRequest.mockResolvedValueOnce({
      statusCode: 200,
      body: { data: { chart2xx: [], chart3xx: [], chart4xx: [], chart5xx: [] } }
    })

    await loadEventsChartAggregation({
      dataset: 'workloadEvents',
      tsRange: VALID_TS_RANGE,
      filters: {},
      groupByField: 'status'
    })

    const query = getQueryString()
    // The bucketed path uses 4 aliases (chart2xx..chart5xx) each grouped by ts.
    expect(query).toMatch(/chart2xx:\s*workloadEvents/)
    expect(query).toMatch(/chart5xx:\s*workloadEvents/)
    // Critically: no GraphQL error was raised by the guard for this supported field.
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('keeps groupByField="status" with an explicit status filter → groupBy: [ts, status]', async () => {
    mockDecoratorRequest.mockResolvedValueOnce(emptyChartResponse())

    await loadEventsChartAggregation({
      dataset: 'workloadEvents',
      tsRange: VALID_TS_RANGE,
      // An explicit `status` filter disables the bucketed alias path, so the
      // query falls back to plain groupBy: [ts, status].
      filters: { and: { status: 200 } },
      groupByField: 'status'
    })

    const query = getQueryString()
    expect(query).toMatch(/groupBy:\s*\[ts,\s*status\]/)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('keeps groupByField="requestMethod" for workloadEvents (whitelist hit)', async () => {
    mockDecoratorRequest.mockResolvedValueOnce(emptyChartResponse())

    await loadEventsChartAggregation({
      dataset: 'workloadEvents',
      tsRange: VALID_TS_RANGE,
      filters: {},
      groupByField: 'requestMethod'
    })

    const query = getQueryString()
    expect(query).toMatch(/groupBy:\s*\[ts,\s*requestMethod\]/)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('drops unrecognized field "totallyMadeUp" even on whitelisted dataset', async () => {
    mockDecoratorRequest.mockResolvedValueOnce(emptyChartResponse())

    await loadEventsChartAggregation({
      dataset: 'workloadEvents',
      tsRange: VALID_TS_RANGE,
      filters: {},
      groupByField: 'totallyMadeUp'
    })

    const query = getQueryString()
    expect(query).toMatch(/groupBy:\s*\[ts\]/)
    expect(query).not.toContain('totallyMadeUp')
    expect(console.warn).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Defense in depth — the service guard catches calls that bypassed the entry guard
// ---------------------------------------------------------------------------

describe('loadEventsChartAggregation · defense-in-depth guard (Task 10.4*)', () => {
  it('every problematic dataset returns a non-error response when called with bad groupBy', async () => {
    // Run the full 5-dataset sweep with a problematic field and assert no
    // exception escapes — the user sees data (or empty state), never a crash.
    for (const dataset of PROBLEMATIC_DATASETS) {
      mockDecoratorRequest.mockResolvedValueOnce(emptyChartResponse())

      await expect(
        loadEventsChartAggregation({
          dataset,
          tsRange: VALID_TS_RANGE,
          filters: {},
          groupByField: 'unsupported'
        })
      ).resolves.toBeDefined()
    }
  })
})
