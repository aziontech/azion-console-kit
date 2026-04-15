import { convertGQLAggregation } from '@/helpers/convert-gql-aggregation'
import { AxiosHttpClientSignalDecorator } from '../axios/AxiosHttpClientSignalDecorator'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeRealTimeEventsBaseUrl } from './make-real-time-events-service'
import { makeBeholderBaseUrl } from '../real-time-metrics-services/make-beholder-base-url'
import * as Errors from '@/services/axios/errors'

/**
 * Load aggregated event data for chart visualization.
 * Uses GraphQL aggregation with groupBy for time-series data.
 *
 * @param {Object} params - Query parameters
 * @param {string} params.dataset - Dataset name (e.g., 'httpEvents')
 * @param {Object} params.tsRange - Time range { tsRangeBegin, tsRangeEnd }
 * @param {Array} params.groupBy - Fields to group by (e.g., ['ts', 'status'])
 * @param {Object} params.aggregation - Aggregation config (default: { count: 'rows' })
 * @param {Object} params.filters - Additional filters (and, in)
 * @param {number} params.limit - Query limit (default: 10000)
 * @returns {Promise<Array>} Aggregated data points
 */
export const loadEventsAggregation = async ({
  dataset,
  tsRange,
  groupBy = ['ts'],
  aggregation = { count: 'rows' },
  filters = {},
  limit = 10000
}) => {
  if (!tsRange?.tsRangeBegin || !tsRange?.tsRangeEnd) {
    return []
  }

  const payload = convertGQLAggregation({
    dataset,
    tsRange,
    groupBy,
    aggregation,
    filters,
    limit,
    orderBy: groupBy.includes('ts') ? 'ts_ASC' : `${Object.keys(aggregation)[0]}_DESC`
  })

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return parseHttpResponse(httpResponse, dataset)
}

/**
 * Adapt response from GraphQL aggregation query.
 * Converts the raw response into a format suitable for charts.
 */
const adaptResponse = (body, dataset) => {
  const rawData = body.data[dataset]

  if (!rawData || !Array.isArray(rawData)) {
    return []
  }

  return rawData.map((item) => {
    const normalized = {}

    if (item.count !== undefined) normalized.count = item.count
    if (item.sum !== undefined) normalized.sum = item.sum
    if (item.avg !== undefined) normalized.avg = item.avg
    if (item.ts) normalized.ts = item.ts

    // Handle all groupBy fields dynamically
    Object.keys(item).forEach((key) => {
      if (!['count', 'sum', 'avg', 'ts'].includes(key)) {
        normalized[key] = item[key]
      }
    })

    return normalized
  })
}

/**
 * Parses the HTTP response and returns the data or throws an error.
 */
const parseHttpResponse = (response, dataset) => {
  const { body, statusCode } = response

  switch (statusCode) {
    case 200:
      return adaptResponse(body, dataset)
    case 400:
      throw new Error(body.detail || 'Bad Request')
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Error(body.detail || 'Forbidden')
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}

/**
 * Load aggregated event counts for chart/histogram visualization.
 *
 * Uses the Metrics API (v4/metrics/graphql) instead of Events API because:
 * - Metrics API groups by ts with server-side resampling (minute/hour/day)
 * - Events API groups by exact second, generating too many groups for large ranges
 * - Metrics API supports ranges up to 2 years with proper aggregation
 *
 * Maps Events datasets to their Metrics counterparts:
 * httpEvents → httpMetrics, edgeFunctionsEvents → edgeFunctionsMetrics, etc.
 *
 * @param {Object} params
 * @param {string} params.dataset - Events dataset name (e.g., 'httpEvents')
 * @param {Object} params.tsRange - { tsRangeBegin, tsRangeEnd }
 * @param {Object} [params.filters] - Additional filters (and, in)
 * @returns {Promise<Array<{ts: string, count: number}>>}
 */
export const loadEventsChartAggregation = async ({ dataset, tsRange, filters = {} }) => {
  if (!tsRange?.tsRangeBegin || !tsRange?.tsRangeEnd) {
    return []
  }

  // Map Events dataset → Metrics dataset
  const METRICS_DATASET_MAP = {
    httpEvents: 'httpMetrics',
    edgeFunctionsEvents: 'edgeFunctionsMetrics',
    cellsConsoleEvents: 'edgeFunctionsMetrics',
    imagesProcessedEvents: 'imagesProcessedMetrics',
    l2CacheEvents: 'l2CacheMetrics',
    idnsQueriesEvents: 'idnsQueriesMetrics',
    dataStreamedEvents: 'dataStreamedMetrics',
    activityHistoryEvents: null // no metrics equivalent
  }

  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset) {
    // Fallback to Events API for datasets without Metrics equivalent
    return loadEventsChartFromEventsApi({ dataset, tsRange, filters })
  }

  // Normalize tsRange to ISO strings
  const tsRangeBegin =
    tsRange.tsRangeBegin instanceof Date
      ? tsRange.tsRangeBegin.toISOString()
      : String(tsRange.tsRangeBegin)
  const tsRangeEnd =
    tsRange.tsRangeEnd instanceof Date
      ? tsRange.tsRangeEnd.toISOString()
      : String(tsRange.tsRangeEnd)

  // Build Metrics API query — same pattern as Real-Time Metrics
  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {
      ${metricsDataset} (
        limit: 10000
        aggregate: { sum: requests }
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: { begin: $tsRange_begin, end: $tsRange_end }
        }
      ) {
        ts
        sum
      }
    }`,
    variables: {
      tsRange_begin: tsRangeBegin,
      tsRange_end: tsRangeEnd
    }
  }

  const response = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: makeBeholderBaseUrl(),
    method: 'POST',
    body: JSON.stringify(query)
  })

  if (response.statusCode !== 200) {
    throw new Error(response.body?.detail || 'Metrics API error')
  }

  const rawData = response.body?.data?.[metricsDataset]
  if (!rawData || !Array.isArray(rawData)) return []

  // Convert Metrics format { ts, sum } → chart format { ts, count }
  return rawData.map((item) => ({
    ts: item.ts,
    count: item.sum || 0
  }))
}

/**
 * Fallback: load chart data from Events API for datasets without Metrics equivalent.
 */
async function loadEventsChartFromEventsApi({ dataset, tsRange, filters }) {
  const normalizedTsRange = {
    tsRangeBegin:
      tsRange.tsRangeBegin instanceof Date
        ? tsRange.tsRangeBegin.toISOString()
        : String(tsRange.tsRangeBegin),
    tsRangeEnd:
      tsRange.tsRangeEnd instanceof Date
        ? tsRange.tsRangeEnd.toISOString()
        : String(tsRange.tsRangeEnd)
  }

  const payload = convertGQLAggregation({
    dataset,
    tsRange: normalizedTsRange,
    groupBy: ['ts'],
    aggregation: { count: 'rows' },
    orderBy: 'ts_ASC',
    limit: 10000,
    filters
  })

  const decorator = new AxiosHttpClientSignalDecorator()
  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return parseHttpResponse(httpResponse, dataset)
}

export default loadEventsAggregation
