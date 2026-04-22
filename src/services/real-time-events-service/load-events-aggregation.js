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
 * @param {string} params.dataset - Dataset name (e.g., 'workloadEvents')
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
 * workloadEvents → httpMetrics, functionEvents → edgeFunctionsMetrics, etc.
 *
 * @param {Object} params
 * @param {string} params.dataset - Events dataset name (e.g., 'workloadEvents')
 * @param {Object} params.tsRange - { tsRangeBegin, tsRangeEnd }
 * @param {Object} [params.filters] - Additional filters (and, in)
 * @param {string} [params.groupByField] - Field to group by for stack breakdown (e.g., 'status')
 * @returns {Promise<{chartData: Array, kpis: Object}>}
 */
const METRICS_DATASET_MAP = {
  workloadEvents: 'httpMetrics',
  functionEvents: 'edgeFunctionsMetrics',
  functionConsoleEvents: 'edgeFunctionsMetrics',
  imageProcessedEvents: 'imagesProcessedMetrics',
  tieredCacheEvents: 'l2CacheMetrics',
  edgeDnsQueriesEvents: 'idnsQueriesMetrics',
  dataStreamedEvents: 'dataStreamedMetrics',
  activityHistoryEvents: null
}

const EMPTY_RESULT = Object.freeze({ chartData: [], kpis: null })

const STATUS_METRICS_ALIASES = Object.freeze([
  { alias: 'status2xx', bucket: '2xx', rangeBegin: 200, rangeEnd: 299 },
  { alias: 'status3xx', bucket: '3xx', rangeBegin: 300, rangeEnd: 399 },
  { alias: 'status4xx', bucket: '4xx', rangeBegin: 400, rangeEnd: 499 },
  { alias: 'status5xx', bucket: '5xx', rangeBegin: 500, rangeEnd: 599 }
])

const REQUEST_METHOD_BUCKETS = ['GET', 'POST', 'PUT', 'DELETE']

function buildMetricsKpisFromStatusChart(chartData) {
  const totals = chartData.reduce(
    (accumulator, row) => {
      accumulator.total +=
        (row['2xx'] || 0) + (row['3xx'] || 0) + (row['4xx'] || 0) + (row['5xx'] || 0)
      accumulator.clientErrors += row['4xx'] || 0
      accumulator.serverErrors += row['5xx'] || 0
      return accumulator
    },
    { total: 0, clientErrors: 0, serverErrors: 0 }
  )

  return {
    total: totals.total,
    clientErrors: totals.clientErrors,
    serverErrors: totals.serverErrors,
    avgRequestTime: null,
    p95RequestTime: null,
    p99RequestTime: null,
    supportsStatusBreakdown: true,
    supportsRequestTime: false
  }
}

async function loadStatusChartFromMetricsApi({ dataset, tsRange, filters = {} }) {
  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset) {
    return EMPTY_RESULT
  }

  const tsRangeBegin =
    tsRange.tsRangeBegin instanceof Date
      ? tsRange.tsRangeBegin.toISOString()
      : String(tsRange.tsRangeBegin)
  const tsRangeEnd =
    tsRange.tsRangeEnd instanceof Date
      ? tsRange.tsRangeEnd.toISOString()
      : String(tsRange.tsRangeEnd)

  // Extract status filters from user filters to intersect with bucket ranges
  const statusFilters = { gte: null, lte: null, gt: null, lt: null }
  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    const match = key.match(/^status(Gte|Lte|Gt|Lt)$/)
    if (match) {
      const op = match[1].toLowerCase()
      statusFilters[op] = Number(value)
    }
  })

  // Build additional filter fragments for non-status fields
  const extraFilterFragments = []
  const extraVariables = {}
  const extraParamDeclarations = []
  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    if (!key.startsWith('status')) {
      const varName = `filter_${key}`
      extraVariables[varName] = value
      extraFilterFragments.push(`${key}: $${varName}`)
      const varType = typeof value === 'number' ? 'Int' : 'String'
      extraParamDeclarations.push(`$${varName}: ${varType}`)
    }
  })
  Object.entries(filters?.in || {}).forEach(([key, value]) => {
    if (!key.startsWith('status')) {
      const varName = `in_${key}`
      extraVariables[varName] = value
      extraFilterFragments.push(`${key}: $${varName}`)
      extraParamDeclarations.push(`$${varName}: [String]`)
    }
  })
  const extraFilterStr =
    extraFilterFragments.length > 0 ? `, ${extraFilterFragments.join(', ')}` : ''
  const extraParamsStr =
    extraParamDeclarations.length > 0 ? `, ${extraParamDeclarations.join(', ')}` : ''

  const aliasQuery = STATUS_METRICS_ALIASES.map(({ alias, rangeBegin, rangeEnd }) => {
    // Intersect bucket range with user's status filter
    let effectiveBegin = rangeBegin
    let effectiveEnd = rangeEnd
    if (statusFilters.gte !== null) effectiveBegin = Math.max(effectiveBegin, statusFilters.gte)
    if (statusFilters.gt !== null) effectiveBegin = Math.max(effectiveBegin, statusFilters.gt + 1)
    if (statusFilters.lte !== null) effectiveEnd = Math.min(effectiveEnd, statusFilters.lte)
    if (statusFilters.lt !== null) effectiveEnd = Math.min(effectiveEnd, statusFilters.lt - 1)

    // Skip this bucket if the intersection is empty
    if (effectiveBegin > effectiveEnd) return ''

    return `
      ${alias}: ${metricsDataset}(
        limit: 10000
        aggregate: { sum: requests }
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: { begin: $tsRange_begin, end: $tsRange_end }
          statusRange: { begin: ${effectiveBegin}, end: ${effectiveEnd} }${extraFilterStr}
        }
      ) {
        ts
        sum
      }`
  }).join('')

  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {${aliasQuery}
    }`,
    variables: {
      tsRange_begin: tsRangeBegin,
      tsRange_end: tsRangeEnd,
      ...extraVariables
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

  const responseData = response.body?.data || {}
  const normalizedBuckets = {}
  STATUS_METRICS_ALIASES.forEach(({ alias }) => {
    normalizedBuckets[alias] = Array.isArray(responseData[alias])
      ? responseData[alias].map((item) => ({ ts: item.ts, count: item.sum || 0 }))
      : []
  })

  const chartData = mergeChartBucketAliases(normalizedBuckets, STATUS_METRICS_ALIASES)
  return { chartData, kpis: buildMetricsKpisFromStatusChart(chartData) }
}

/**
 * Load chart data grouped by HTTP request method using Metrics API.
 * Uses groupBy: [ts, requestMethod] to get time-series data per method.
 */
async function loadRequestMethodChartFromMetricsApi({ dataset, tsRange, filters = {} }) {
  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset) {
    return EMPTY_RESULT
  }

  const tsRangeBegin =
    tsRange.tsRangeBegin instanceof Date
      ? tsRange.tsRangeBegin.toISOString()
      : String(tsRange.tsRangeBegin)
  const tsRangeEnd =
    tsRange.tsRangeEnd instanceof Date
      ? tsRange.tsRangeEnd.toISOString()
      : String(tsRange.tsRangeEnd)

  // Build filter variables
  const extraFilterFragments = []
  const variables = {
    tsRange_begin: tsRangeBegin,
    tsRange_end: tsRangeEnd
  }
  const extraParamDeclarations = []
  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    const varName = `filter_${key}`
    variables[varName] = value
    extraFilterFragments.push(`${key}: $${varName}`)
    const varType = typeof value === 'number' ? 'Int' : 'String'
    extraParamDeclarations.push(`$${varName}: ${varType}`)
  })
  Object.entries(filters?.in || {}).forEach(([key, value]) => {
    const varName = `in_${key}`
    variables[varName] = value
    extraFilterFragments.push(`${key}: $${varName}`)
    extraParamDeclarations.push(`$${varName}: [String]`)
  })
  const extraFilterStr =
    extraFilterFragments.length > 0 ? `, ${extraFilterFragments.join(', ')}` : ''
  const extraParamsStr =
    extraParamDeclarations.length > 0 ? `, ${extraParamDeclarations.join(', ')}` : ''

  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {
      ${metricsDataset} (
        limit: 10000
        aggregate: { sum: requests }
        groupBy: [ts, requestMethod]
        orderBy: [ts_ASC]
        filter: {
          tsRange: { begin: $tsRange_begin, end: $tsRange_end }${extraFilterStr}
        }
      ) {
        ts
        requestMethod
        sum
      }
    }`,
    variables
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
  if (!rawData || !Array.isArray(rawData)) return { chartData: [], kpis: null }

  // Pivot the data: group by ts, with columns for each method
  const perTs = new Map()
  rawData.forEach((item) => {
    if (!item?.ts) return
    const method = String(item.requestMethod || 'OTHER').toUpperCase()
    const bucket = REQUEST_METHOD_BUCKETS.includes(method) ? method : 'OTHER'
    const tsKey = item.ts

    if (!perTs.has(tsKey)) perTs.set(tsKey, { ts: item.ts })
    const entry = perTs.get(tsKey)
    entry[bucket] = (entry[bucket] || 0) + (item.sum || 0)
  })

  const chartData = Array.from(perTs.values()).sort(
    (left, right) => new Date(left.ts) - new Date(right.ts)
  )

  // Calculate KPIs
  const totals = chartData.reduce((acc, row) => {
    REQUEST_METHOD_BUCKETS.forEach((method) => {
      acc[method] = (acc[method] || 0) + (row[method] || 0)
    })
    acc.OTHER = (acc.OTHER || 0) + (row.OTHER || 0)
    return acc
  }, {})

  const total = Object.values(totals).reduce((sum, val) => sum + val, 0)

  return {
    chartData,
    kpis: {
      total,
      clientErrors: null,
      serverErrors: null,
      avgRequestTime: null,
      supportsStatusBreakdown: false,
      supportsRequestTime: false
    }
  }
}

export const loadEventsChartAggregation = async ({
  dataset,
  tsRange,
  filters = {},
  groupByField = null
}) => {
  if (!tsRange?.tsRangeBegin || !tsRange?.tsRangeEnd) {
    return EMPTY_RESULT
  }

  // Calculate duration to determine which API to use
  const beginMs = new Date(tsRange.tsRangeBegin).getTime()
  const endMs = new Date(tsRange.tsRangeEnd).getTime()
  const duration = endMs - beginMs

  // For short ranges (≤ 15 minutes), use Events API which returns second-level granularity.
  // Metrics API has an adaptive resolver that resamples to minute-level for ranges up to 3 days.
  // Events API returns raw events with per-second timestamps, allowing finer granularity.
  const METRICS_API_DURATION_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes

  if (duration > 0 && duration <= METRICS_API_DURATION_THRESHOLD_MS) {
    return loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField })
  }

  const metricsDataset = METRICS_DATASET_MAP[dataset]

  // Datasets without Metrics equivalent fall back to Events API.
  if (!metricsDataset) {
    return loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField })
  }

  // Status breakdown: use Metrics API with statusRange filter
  if (groupByField === 'status') {
    return loadStatusChartFromMetricsApi({ dataset, tsRange, filters })
  }

  // Request method breakdown: use Metrics API with groupBy: [ts, requestMethod]
  if (groupByField === 'requestMethod') {
    return loadRequestMethodChartFromMetricsApi({ dataset, tsRange, filters })
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

  // Build filter variables for non-status fields
  const extraFilterFragments = []
  const extraParamDeclarations = []
  const variables = {
    tsRange_begin: tsRangeBegin,
    tsRange_end: tsRangeEnd
  }
  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    if (!key.startsWith('status')) {
      const varName = `filter_${key}`
      variables[varName] = value
      extraFilterFragments.push(`${key}: $${varName}`)
      // Determine type based on value
      const varType = typeof value === 'number' ? 'Int' : 'String'
      extraParamDeclarations.push(`$${varName}: ${varType}`)
    }
  })
  Object.entries(filters?.in || {}).forEach(([key, value]) => {
    if (!key.startsWith('status')) {
      const varName = `in_${key}`
      variables[varName] = value
      extraFilterFragments.push(`${key}: $${varName}`)
      extraParamDeclarations.push(`$${varName}: [String]`)
    }
  })
  const extraFilterStr =
    extraFilterFragments.length > 0 ? `, ${extraFilterFragments.join(', ')}` : ''
  const extraParamsStr =
    extraParamDeclarations.length > 0 ? `, ${extraParamDeclarations.join(', ')}` : ''

  // Build Metrics API query
  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {
      ${metricsDataset} (
        limit: 10000
        aggregate: { sum: requests }
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          tsRange: { begin: $tsRange_begin, end: $tsRange_end }${extraFilterStr}
        }
      ) {
        ts
        sum
      }
    }`,
    variables
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
  if (!rawData || !Array.isArray(rawData)) return { chartData: [], kpis: null }

  // Convert Metrics format { ts, sum } → chart format { ts, count }
  const chartData = rawData.map((item) => ({
    ts: item.ts,
    count: item.sum || 0
  }))

  // Total is derivable from the chartData sum; status breakdown / requestTime
  // are NOT available from the Metrics API, so kpis is partial.
  const total = chartData.reduce((sum, item) => sum + (item.count || 0), 0)
  return {
    chartData,
    kpis: {
      total,
      clientErrors: null,
      serverErrors: null,
      avgRequestTime: null,
      supportsStatusBreakdown: false,
      supportsRequestTime: false
    }
  }
}

/**
 * Canonical bucket keys used when pivoting a groupBy response into chart
 * multi-series columns. Keeps the number of columns bounded so the chart
 * legend stays readable even if the raw data has dozens of distinct values.
 */
const STACK_BUCKETS = {
  status: (raw) => {
    const statusCode = Number(raw)
    if (!Number.isFinite(statusCode)) return 'other'
    if (statusCode >= 200 && statusCode < 300) return '2xx'
    if (statusCode >= 300 && statusCode < 400) return '3xx'
    if (statusCode >= 400 && statusCode < 500) return '4xx'
    if (statusCode >= 500 && statusCode < 600) return '5xx'
    return 'other'
  },
  requestMethod: (raw) => {
    const method = String(raw || '').toUpperCase()
    if (method === 'GET' || method === 'POST' || method === 'PUT' || method === 'DELETE')
      return method
    return 'other'
  }
}

/**
 * Kibana-style auto-interval (ms) matched to the useChartBucketing table on
 * the client so the server-side pivot lands in the same slots the client will
 * draw. Keeps the pivot bounded even when the raw groupBy produces ts at
 * second resolution (which explodes for 1h+ ranges with high-cardinality
 * fields such as status).
 */
function pickBucketMs(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return 60 * 1000
  const SEC = 1000,
    MIN = 60 * SEC,
    HOUR = 60 * MIN,
    DAY = 24 * HOUR
  if (durationMs <= 1 * MIN) return 5 * SEC
  if (durationMs <= 30 * MIN) return 30 * SEC
  if (durationMs <= 1 * HOUR) return 2 * MIN
  if (durationMs <= 3 * HOUR) return 5 * MIN
  if (durationMs <= 6 * HOUR) return 10 * MIN
  if (durationMs <= 12 * HOUR) return 20 * MIN
  if (durationMs <= 1 * DAY) return 30 * MIN
  if (durationMs <= 3 * DAY) return 1 * HOUR
  if (durationMs <= 7 * DAY) return 3 * HOUR
  if (durationMs <= 30 * DAY) return 12 * HOUR
  return 1 * DAY
}

/**
 * Pivot rows returned by the Events API when grouping by [ts, field] into
 * chart-multi-series shape: one row per aligned-ts with one column per
 * canonical bucket. Time is bucketized to the auto-interval for the requested
 * range so the result is always bounded regardless of raw group cardinality.
 */
function pivotGroupedRows(rows, groupByField, tsRange) {
  const classify = STACK_BUCKETS[groupByField]
  if (!classify) return rows
  const beginMs = tsRange?.tsRangeBegin ? new Date(tsRange.tsRangeBegin).getTime() : NaN
  const endMs = tsRange?.tsRangeEnd ? new Date(tsRange.tsRangeEnd).getTime() : NaN
  const bucketMs =
    Number.isFinite(beginMs) && Number.isFinite(endMs) ? pickBucketMs(endMs - beginMs) : 0

  const perTs = new Map()
  const seenBuckets = new Set()
  rows.forEach((row) => {
    if (!row?.ts) return
    const bucket = classify(row[groupByField])
    seenBuckets.add(bucket)
    const tsMs = new Date(row.ts).getTime()
    if (!Number.isFinite(tsMs)) return
    const aligned = bucketMs > 0 ? Math.floor(tsMs / bucketMs) * bucketMs : tsMs
    if (!perTs.has(aligned)) perTs.set(aligned, { ts: new Date(aligned).toISOString() })
    const entry = perTs.get(aligned)
    entry[bucket] = (entry[bucket] || 0) + (row.count || 0)
  })
  const buckets = Array.from(seenBuckets)
  const result = []
  perTs.forEach((entry) => {
    buckets.forEach((bucketName) => {
      if (entry[bucketName] === undefined) entry[bucketName] = 0
    })
    result.push(entry)
  })
  return result.sort((left, right) => new Date(left.ts) - new Date(right.ts))
}

/**
 * Datasets that expose `status` and `requestTime`. Only these get the full
 * KPI payload (breakdown + avg requestTime); others get total-only.
 */
const HTTP_LIKE_DATASETS = new Set(['workloadEvents'])

const STATUS_CHART_ALIASES = Object.freeze([
  { alias: 'chart2xx', bucket: '2xx', filter: 'statusGte: 200, statusLt: 300' },
  { alias: 'chart3xx', bucket: '3xx', filter: 'statusGte: 300, statusLt: 400' },
  { alias: 'chart4xx', bucket: '4xx', filter: 'statusGte: 400, statusLt: 500' },
  { alias: 'chart5xx', bucket: '5xx', filter: 'statusGte: 500, statusLt: 600' }
])

function mergeChartBucketAliases(data, aliasConfig) {
  const totalsByBucket = {}
  const perTs = new Map()

  aliasConfig.forEach(({ alias, bucket }) => {
    const rows = Array.isArray(data?.[alias]) ? data[alias] : []
    let bucketTotal = 0
    rows.forEach((row) => {
      if (!row?.ts) return
      const count = Number(row.count) || 0
      const tsKey = String(row.ts)
      bucketTotal += count
      if (!perTs.has(tsKey)) perTs.set(tsKey, { ts: row.ts })
      const entry = perTs.get(tsKey)
      entry[bucket] = (entry[bucket] || 0) + count
    })
    totalsByBucket[bucket] = bucketTotal
  })

  const activeBuckets = aliasConfig
    .map(({ bucket }) => bucket)
    .filter((bucket) => (totalsByBucket[bucket] || 0) > 0)

  const result = []
  perTs.forEach((entry) => {
    activeBuckets.forEach((bucket) => {
      if (entry[bucket] === undefined) entry[bucket] = 0
    })
    result.push(entry)
  })

  return result.sort((left, right) => new Date(left.ts) - new Date(right.ts))
}

/**
 * Build a single GraphQL request with aliases so the chart AND the KPI
 * summary (total, 4xx, 5xx, avg requestTime) are resolved in one round-trip.
 * For datasets without status/requestTime, only the chart alias is emitted.
 */
async function loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField = null }) {
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

  const isHttpLike = HTTP_LIKE_DATASETS.has(dataset)
  const hasExplicitStatusFilter = !!(
    Object.keys(filters?.and || {}).some((key) => key.startsWith('status')) ||
    Object.keys(filters?.in || {}).some((key) => key.startsWith('status'))
  )
  const isBucketedStatusStack = groupByField === 'status' && isHttpLike && !hasExplicitStatusFilter
  const chartGroupBy = groupByField && !isBucketedStatusStack ? ['ts', groupByField] : ['ts']

  // Build AND/IN filter fragments once; same fragments are reused across all
  // aliases so every KPI respects the current filter bar.
  const variables = {
    tsBegin: normalizedTsRange.tsRangeBegin,
    tsEnd: normalizedTsRange.tsRangeEnd
  }
  const extraFilterLines = []

  if (filters?.and) {
    Object.entries(filters.and).forEach(([key, value]) => {
      const varName = `and_${key}`
      variables[varName] = value
      extraFilterLines.push(`${key}: $${varName}`)
    })
  }
  if (filters?.in) {
    Object.entries(filters.in).forEach(([key, value]) => {
      const varName = `in_${key}`
      variables[varName] = Array.isArray(value)
        ? value.map((item) => (item?.value !== undefined ? item.value : item))
        : value
      extraFilterLines.push(`${key}: $${varName}`)
    })
  }

  const paramType = (key, value) => {
    if (key === 'tsBegin' || key === 'tsEnd') return 'DateTime!'
    if (Array.isArray(value)) return '[String]'
    if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float'
    return 'String'
  }
  const paramsStr = Object.entries(variables)
    .map(([key, value]) => `$${key}: ${paramType(key, value)}`)
    .join(', ')

  const filterBlock = ['tsRange: { begin: $tsBegin, end: $tsEnd }', ...extraFilterLines].join(', ')

  // Alias 1 — chart series (powers the histogram). Same shape as before.
  const chartAlias = isBucketedStatusStack
    ? STATUS_CHART_ALIASES.map(
        ({ alias, filter }) => `
    ${alias}: ${dataset}(
      limit: 10000
      aggregate: { count: rows }
      groupBy: [ts]
      orderBy: [ts_ASC]
      filter: { ${filterBlock}, ${filter} }
    ) {
      count
      ts
    }`
      ).join('')
    : `
    chart: ${dataset}(
      limit: 10000
      aggregate: { count: rows }
      groupBy: [${chartGroupBy.join(', ')}]
      orderBy: [ts_ASC]
      filter: { ${filterBlock} }
    ) {
      ${['count', ...chartGroupBy].join('\n      ')}
    }`

  // Alias 2 — per-status breakdown. One row per distinct status value so the
  // summary can bucket into 2xx/3xx/4xx/5xx. Only workloadEvents exposes `status`.
  const kpiStatusAlias = isHttpLike
    ? `
    kpiByStatus: ${dataset}(
      limit: 10000
      aggregate: { count: rows }
      groupBy: [status]
      filter: { ${filterBlock} }
    ) {
      count
      status
    }`
    : ''

  // Alias 3 — avg(requestTime). Single scalar result. workloadEvents only.
  const kpiAvgAlias = isHttpLike
    ? `
    kpiAvgRt: ${dataset}(
      limit: 1
      aggregate: { avg: requestTime }
      filter: { ${filterBlock} }
    ) {
      avg
    }`
    : ''

  const query = {
    query: `query (${paramsStr}) {${chartAlias}${kpiStatusAlias}${kpiAvgAlias}
}`,
    variables
  }

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: JSON.stringify(query)
  })

  if (httpResponse.statusCode !== 200) {
    throw new Error(httpResponse.body?.detail || 'Aggregation API error')
  }

  const data = httpResponse.body?.data || {}

  // Chart normalization (same as the old path).
  let chartData = []
  if (isBucketedStatusStack) {
    chartData = mergeChartBucketAliases(data, STATUS_CHART_ALIASES)
  } else {
    const rawChart = Array.isArray(data.chart) ? data.chart : []
    const chartRows = rawChart.map((item) => {
      const normalized = {}
      if (item.count !== undefined) normalized.count = item.count
      if (item.ts) normalized.ts = item.ts
      Object.keys(item).forEach((key) => {
        if (!['count', 'ts'].includes(key)) normalized[key] = item[key]
      })
      return normalized
    })
    chartData = groupByField
      ? pivotGroupedRows(chartRows, groupByField, normalizedTsRange)
      : chartRows
  }

  // KPI normalization.
  let kpis = {
    total: chartData.reduce((sum, row) => {
      if (typeof row.count === 'number') return sum + row.count
      // Stacked rows: sum every numeric column except ts.
      let rowTotal = 0
      Object.entries(row).forEach(([fieldName, fieldValue]) => {
        if (fieldName !== 'ts' && typeof fieldValue === 'number') rowTotal += fieldValue
      })
      return sum + rowTotal
    }, 0),
    clientErrors: null,
    serverErrors: null,
    avgRequestTime: null,
    p95RequestTime: null,
    p99RequestTime: null,
    supportsStatusBreakdown: false,
    supportsRequestTime: false
  }

  if (isHttpLike && Array.isArray(data.kpiByStatus)) {
    const classify = STACK_BUCKETS.status
    let total = 0
    let c4xx = 0
    let c5xx = 0
    data.kpiByStatus.forEach((row) => {
      const bucket = classify(row?.status)
      const count = row?.count || 0
      total += count
      if (bucket === '4xx') c4xx += count
      else if (bucket === '5xx') c5xx += count
    })
    kpis = {
      ...kpis,
      total,
      clientErrors: c4xx,
      serverErrors: c5xx,
      supportsStatusBreakdown: true
    }
  }

  if (isHttpLike && Array.isArray(data.kpiAvgRt) && data.kpiAvgRt[0]?.avg !== undefined) {
    const avg = Number(data.kpiAvgRt[0].avg)
    kpis.avgRequestTime = Number.isFinite(avg) ? avg : null
    kpis.supportsRequestTime = kpis.avgRequestTime !== null
  }

  // Percentiles (p95/p99) intentionally not queried — the Events GraphQL
  // schema does not expose them as aggregates. Slots stay null.

  return { chartData, kpis }
}

export default loadEventsAggregation
