import { describe, it, expect, vi, beforeEach } from 'vitest'
import fc from 'fast-check'

/**
 * Feature: real-time-events-refactor, Property 5: Parameterized GraphQL query variables
 *
 * Validates: Requirements 7.4
 *
 * For any filter values including strings with special characters (quotes,
 * backslashes, newlines), the GraphQL queries in metrics-chart-service.js
 * SHALL use $variable references in the query string and pass values in the
 * variables object, never interpolating raw values into the query template.
 */

vi.mock('@/services/axios/AxiosHttpClientAdapter', () => ({
  AxiosHttpClientAdapter: {
    request: vi.fn()
  }
}))
vi.mock('@/services/real-time-metrics-services/make-beholder-base-url', () => ({
  makeBeholderBaseUrl: () => 'v4/metrics/graphql'
}))
vi.mock('@/services/real-time-events-service/make-real-time-events-service', () => ({
  makeRealTimeEventsBaseUrl: () => 'v4/events/graphql'
}))

const { AxiosHttpClientAdapter } = await import('@/services/axios/AxiosHttpClientAdapter')
const {
  loadMetricsFallback,
  loadMetricsSeries,
  loadFromEventsApi,
  loadMetricsAggregation
} = await import('../metrics-chart-service')

beforeEach(() => {
  vi.clearAllMocks()
})

/**
 * Generator for timestamp-like strings including special characters.
 * Produces ISO-like timestamps mixed with strings containing quotes,
 * backslashes, newlines, and other special chars to stress-test
 * that raw values never leak into the query template.
 */
const SPECIAL_CHARS = ['"', "'", '\\', '\n', '\r', '\t', '$', '{', '}', '`', '<', '>', '&', ';']

// Use integer millis to avoid fc.date() producing Invalid Date in edge cases
const MIN_MS = new Date('2000-01-01T00:00:00Z').getTime()
const MAX_MS = new Date('2035-12-31T23:59:59Z').getTime()

const arbTimestampWithSpecialChars = fc.oneof(
  // Valid ISO timestamps via integer millis (safe from Invalid Date)
  fc.integer({ min: MIN_MS, max: MAX_MS }).map((ms) => new Date(ms).toISOString()),
  // Strings with special characters that could break query interpolation
  fc
    .array(fc.constantFrom(...SPECIAL_CHARS, 'a', 'Z', '0', '9', '-', ':', 'T', ' '), {
      minLength: 1,
      maxLength: 60
    })
    .map((chars) => chars.join(''))
)

/**
 * Stub the HTTP adapter to return a successful response so the service
 * functions proceed past the request without throwing.
 */
function stubSuccessResponse(datasetOrAliases) {
  AxiosHttpClientAdapter.request.mockResolvedValue({
    statusCode: 200,
    body: {
      data:
        typeof datasetOrAliases === 'string'
          ? { [datasetOrAliases]: [{ ts: '2024-01-01T00:00:00Z', sum: 1, count: 1 }] }
          : datasetOrAliases
    }
  })
}

/**
 * Parse the body sent to AxiosHttpClientAdapter.request and extract
 * the query string and variables object.
 */
function extractQueryPayload() {
  const call = AxiosHttpClientAdapter.request.mock.calls[0]
  if (!call) return null
  const payload = JSON.parse(call[0].body)
  return { queryStr: payload.query, variables: payload.variables }
}

/**
 * Assert the core parameterization property:
 * 1. The query string declares $tsRange_begin and $tsRange_end as variables
 * 2. The variables object contains tsRange_begin and tsRange_end with the actual values
 * 3. The raw begin/end values do NOT appear interpolated in the query string
 *    (only checked when the value is distinctive enough — length > 10 and not
 *    a substring that could collide with GraphQL keywords)
 */
function assertParameterizedQuery(queryStr, variables, begin, end) {
  // Query string must declare variable parameters
  expect(queryStr).toContain('$tsRange_begin')
  expect(queryStr).toContain('$tsRange_end')

  // Variables object must carry the actual values
  expect(variables).toHaveProperty('tsRange_begin', begin)
  expect(variables).toHaveProperty('tsRange_end', end)

  // Raw values must NOT be interpolated into the query string.
  // We check this for values that are distinctive enough to not be
  // a coincidental substring of GraphQL syntax.
  const isDistinctive = (val) => typeof val === 'string' && val.length > 10
  if (isDistinctive(begin)) {
    expect(queryStr).not.toContain(begin)
  }
  if (isDistinctive(end)) {
    expect(queryStr).not.toContain(end)
  }
}

describe('Feature: real-time-events-refactor, Property 5: Parameterized GraphQL query variables', () => {
  it('loadMetricsFallback uses $variable references for tsRange (non-directFields)', async () => {
    await fc.assert(
      fc.asyncProperty(arbTimestampWithSpecialChars, arbTimestampWithSpecialChars, async (begin, end) => {
        vi.clearAllMocks()
        stubSuccessResponse('httpMetrics')

        const config = {
          metricsApiFallback: {
            metricsDataset: 'httpMetrics',
            fields: ['requests']
          }
        }

        await loadMetricsFallback(config, begin, end)

        const result = extractQueryPayload()
        expect(result).not.toBeNull()
        assertParameterizedQuery(result.queryStr, result.variables, begin, end)
      }),
      { numRuns: 100 }
    )
  })

  it('loadMetricsFallback uses $variable references for tsRange (directFields)', async () => {
    await fc.assert(
      fc.asyncProperty(arbTimestampWithSpecialChars, arbTimestampWithSpecialChars, async (begin, end) => {
        vi.clearAllMocks()
        stubSuccessResponse({ fieldA: [{ ts: '2024-01-01T00:00:00Z', fieldA: 10 }] })

        const config = {
          metricsApiFallback: {
            metricsDataset: 'httpMetrics',
            directFields: true,
            fields: ['fieldA']
          }
        }

        await loadMetricsFallback(config, begin, end)

        const result = extractQueryPayload()
        expect(result).not.toBeNull()
        assertParameterizedQuery(result.queryStr, result.variables, begin, end)
      }),
      { numRuns: 100 }
    )
  })

  it('loadMetricsSeries uses $variable references for tsRange (groupByPivot)', async () => {
    await fc.assert(
      fc.asyncProperty(arbTimestampWithSpecialChars, arbTimestampWithSpecialChars, async (begin, end) => {
        vi.clearAllMocks()
        stubSuccessResponse('botManagerMetrics')

        const config = {
          metricsApiSeries: {
            metricsDataset: 'botManagerMetrics',
            groupByPivot: {
              field: 'classified',
              aggregate: 'sum: requests'
            }
          }
        }

        await loadMetricsSeries(config, begin, end)

        const result = extractQueryPayload()
        expect(result).not.toBeNull()
        assertParameterizedQuery(result.queryStr, result.variables, begin, end)
      }),
      { numRuns: 100 }
    )
  })

  it('loadMetricsSeries uses $variable references for tsRange (series path)', async () => {
    await fc.assert(
      fc.asyncProperty(arbTimestampWithSpecialChars, arbTimestampWithSpecialChars, async (begin, end) => {
        vi.clearAllMocks()
        stubSuccessResponse({ s0: [{ ts: '2024-01-01T00:00:00Z', sum: 1 }] })

        const config = {
          metricsApiSeries: {
            metricsDataset: 'botManagerMetrics',
            series: [{ name: 'testSeries', aggregate: 'sum: requests', filters: {} }]
          }
        }

        await loadMetricsSeries(config, begin, end)

        const result = extractQueryPayload()
        expect(result).not.toBeNull()
        assertParameterizedQuery(result.queryStr, result.variables, begin, end)
      }),
      { numRuns: 100 }
    )
  })

  it('loadFromEventsApi uses $variable references for tsRange (series path)', async () => {
    await fc.assert(
      fc.asyncProperty(arbTimestampWithSpecialChars, arbTimestampWithSpecialChars, async (begin, end) => {
        vi.clearAllMocks()
        stubSuccessResponse({ allowed: [{ ts: '2024-01-01T00:00:00Z', count: 1 }] })

        const config = {
          eventsApi: {
            dataset: 'workloadEvents',
            series: [{ name: 'allowed', filters: {} }]
          }
        }

        await loadFromEventsApi(config, begin, end)

        const result = extractQueryPayload()
        expect(result).not.toBeNull()
        assertParameterizedQuery(result.queryStr, result.variables, begin, end)
      }),
      { numRuns: 100 }
    )
  })

  it('loadFromEventsApi uses $variable references for tsRange (groupByPivot)', async () => {
    await fc.assert(
      fc.asyncProperty(arbTimestampWithSpecialChars, arbTimestampWithSpecialChars, async (begin, end) => {
        vi.clearAllMocks()
        stubSuccessResponse('workloadEvents')

        const config = {
          eventsApi: {
            dataset: 'workloadEvents',
            groupByPivot: { field: 'status', filters: {} }
          }
        }

        await loadFromEventsApi(config, begin, end)

        const result = extractQueryPayload()
        expect(result).not.toBeNull()
        assertParameterizedQuery(result.queryStr, result.variables, begin, end)
      }),
      { numRuns: 100 }
    )
  })

  it('loadMetricsAggregation uses $variable references for tsRange', async () => {
    await fc.assert(
      fc.asyncProperty(arbTimestampWithSpecialChars, arbTimestampWithSpecialChars, async (begin, end) => {
        vi.clearAllMocks()
        stubSuccessResponse('httpMetrics')

        const config = {
          metricsDataset: 'httpMetrics',
          aggregation: 'requests'
        }

        await loadMetricsAggregation(config, begin, end, {
          loadAggregableFields: () => Promise.resolve(new Set())
        })

        const result = extractQueryPayload()
        expect(result).not.toBeNull()
        assertParameterizedQuery(result.queryStr, result.variables, begin, end)
      }),
      { numRuns: 100 }
    )
  })
})
