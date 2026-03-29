import { convertGQLAggregation } from '@/helpers/convert-gql-aggregation'
import { AxiosHttpClientSignalDecorator } from '../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from './make-real-time-events-service'
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
 * Load bucketed event counts for histogram visualization.
 * Sends a single GraphQL request with aliased sub-queries — one per time bucket —
 * to get an accurate count distribution across the full time range.
 *
 * This avoids the truncation problem of groupBy:[ts] + limit, which only returns
 * the earliest N distinct timestamps and leaves the rest of the range empty.
 *
 * @param {Object} params
 * @param {string} params.dataset - Dataset name (e.g., 'httpEvents')
 * @param {Object} params.tsRange - { tsRangeBegin, tsRangeEnd }
 * @param {Object} [params.filters] - Additional filters (and, in)
 * @param {number} [params.bucketCount] - Number of histogram buckets (auto-calculated if omitted)
 * @returns {Promise<Array<{ts: string, count: number}>>}
 */
export const loadBucketedEventsAggregation = async ({
  dataset,
  tsRange,
  filters = {},
  bucketCount
}) => {
  if (!tsRange?.tsRangeBegin || !tsRange?.tsRangeEnd) {
    return []
  }

  const begin = new Date(tsRange.tsRangeBegin).getTime()
  const end = new Date(tsRange.tsRangeEnd).getTime()
  const duration = end - begin

  if (duration <= 0) return []

  if (!bucketCount) {
    bucketCount = calculateHistogramBuckets(duration)
  }

  const bucketSize = duration / bucketCount
  const payload = buildBucketedQuery({ dataset, begin, bucketSize, bucketCount, filters })

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return parseBucketedResponse(httpResponse, begin, bucketSize, bucketCount)
}

/**
 * Calculate an appropriate number of histogram buckets based on time range duration.
 * Aims for a readable bar density that avoids overcrowding or sparse charts.
 */
function calculateHistogramBuckets(durationMs) {
  const MINUTE = 60_000
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR

  if (durationMs <= 15 * MINUTE) return Math.max(Math.ceil(durationMs / MINUTE), 5)
  if (durationMs <= HOUR) return 30
  if (durationMs <= 6 * HOUR) return 36
  if (durationMs <= DAY) return 48
  if (durationMs <= 7 * DAY) return 42
  return 60
}

/**
 * Build a single GraphQL query with aliased sub-queries for each time bucket.
 * Each alias queries the count for a narrow tsRange slice.
 */
function buildBucketedQuery({ dataset, begin, bucketSize, bucketCount, filters }) {
  const variables = {}

  // Shared filter variables (same across all buckets)
  const sharedFilterParts = []

  if (filters.and) {
    Object.entries(filters.and).forEach(([key, value]) => {
      const varName = `f_${key}`
      variables[varName] = value
      sharedFilterParts.push(`${key}: $${varName}`)
    })
  }

  if (filters.in) {
    Object.entries(filters.in).forEach(([key, value]) => {
      const varName = `fi_${key}`
      variables[varName] = Array.isArray(value)
        ? value.map((item) => (item.value !== undefined ? item.value : item))
        : value
      sharedFilterParts.push(`${key}: $${varName}`)
    })
  }

  // Build one aliased sub-query per bucket
  const bucketLines = []
  for (let idx = 0; idx < bucketCount; idx++) {
    const bStart = new Date(begin + idx * bucketSize).toISOString()
    const bEnd = new Date(begin + (idx + 1) * bucketSize).toISOString()

    variables[`b${idx}s`] = bStart
    variables[`b${idx}e`] = bEnd

    const filterParts = [`tsRange: { begin: $b${idx}s, end: $b${idx}e }`, ...sharedFilterParts]

    bucketLines.push(
      `b${idx}: ${dataset}(limit: 1, aggregate: { count: rows }, filter: { ${filterParts.join(', ')} }) { count }`
    )
  }

  // Variable declarations
  const varDecls = Object.entries(variables).map(([key, value]) => {
    let type
    if (/^b\d+[se]$/.test(key)) {
      type = 'DateTime!'
    } else if (Array.isArray(value)) {
      type = '[String]'
    } else if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'Int' : 'Float'
    } else {
      type = 'String'
    }
    return `$${key}: ${type}`
  })

  const query = `query(${varDecls.join(', ')}) {\n  ${bucketLines.join('\n  ')}\n}`

  return { query, variables }
}

/**
 * Parse the aliased bucketed response into chart-ready data.
 */
function parseBucketedResponse(response, beginMs, bucketSizeMs, bucketCount) {
  const { body, statusCode } = response

  switch (statusCode) {
    case 200: {
      const results = []
      for (let idx = 0; idx < bucketCount; idx++) {
        const bucketData = body.data?.[`b${idx}`]
        const count = Array.isArray(bucketData) ? bucketData[0]?.count || 0 : 0
        results.push({
          ts: new Date(beginMs + idx * bucketSizeMs).toISOString(),
          count
        })
      }
      return results
    }
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

export default loadEventsAggregation
