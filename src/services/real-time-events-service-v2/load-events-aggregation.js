import { convertGQLAggregation } from '@/helpers/convert-gql-aggregation'
import { AxiosHttpClientSignalDecorator } from '../axios/AxiosHttpClientSignalDecorator'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeRealTimeEventsBaseUrl } from './make-real-time-events-service'
import { makeBeholderBaseUrl } from '../real-time-metrics-services/make-beholder-base-url'
import * as Errors from '@/services/axios/errors'
import { resolveChartApi } from './chart-api-router'
import { buildFilterParts } from './_shared/build-filter-parts'
import { cleanBuiltFilterForMetrics } from './_shared/filter/adapters'
import { buildMetricsInlineFilter, toInlineSuffix } from './_shared/graphql/metrics-filter-inline'
import { pivotTimeseries } from './_shared/graphql/pivot-timeseries'
import { normalizeTsBounds } from './_shared/ts-normalize'
import { getBucketInterval } from './_shared/buckets'

// True when any clause in the filter (across `and`, `in`, or any `or` group)
// targets a key starting with `fieldPrefix` (e.g. "status"). Handles both the
// flat AND-only shape and the nested `{ or: [ { and, in }, ... ] }` shape.
function filterMentionsField(filters, fieldPrefix) {
  const groupHits = (group) =>
    Object.keys(group?.and || {}).some((key) => key.startsWith(fieldPrefix)) ||
    Object.keys(group?.in || {}).some((key) => key.startsWith(fieldPrefix))
  if (Array.isArray(filters?.or)) return filters.or.some(groupHits)
  return groupHits(filters)
}

export const loadEventsAggregation = async ({
  dataset,
  tsRange,
  groupBy = ['ts'],
  aggregation = { count: 'rows' },
  filters = {},
  limit = 10000
}) => {
  if (!tsRange?.tsRangeBegin || !tsRange?.tsRangeEnd) return []
  const orderBy =
    groupBy.length === 0
      ? undefined
      : groupBy.includes('ts')
        ? 'ts_ASC'
        : `${Object.keys(aggregation)[0]}_DESC`
  const payload = convertGQLAggregation({
    dataset,
    tsRange,
    groupBy,
    aggregation,
    filters,
    limit,
    orderBy
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

const adaptResponse = (body, dataset) => {
  const rawData = body.data[dataset]
  if (!rawData || !Array.isArray(rawData)) return []
  return rawData.map((item) => {
    const normalized = {}
    if (item.count !== undefined) normalized.count = item.count
    if (item.sum !== undefined) normalized.sum = item.sum
    if (item.avg !== undefined) normalized.avg = item.avg
    if (item.ts) normalized.ts = item.ts
    Object.keys(item).forEach((key) => {
      if (!['count', 'sum', 'avg', 'ts'].includes(key)) normalized[key] = item[key]
    })
    return normalized
  })
}

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

const METRICS_DATASET_MAP = {
  workloadEvents: 'httpMetrics',
  functionEvents: 'edgeFunctionsMetrics',
  functionConsoleEvents: 'edgeFunctionsMetrics',
  imagesProcessedEvents: 'imagesProcessedMetrics',
  tieredCacheEvents: 'l2CacheMetrics',
  edgeDnsQueriesEvents: 'idnsQueriesMetrics',
  dataStreamedEvents: 'dataStreamedMetrics',
  activityHistoryEvents: null
}

const METRICS_AGGREGATE_MAP = {
  httpMetrics: 'sum: requests',
  edgeFunctionsMetrics: 'count: rows',
  imagesProcessedMetrics: 'sum: requests',
  l2CacheMetrics: 'sum: requests',
  idnsQueriesMetrics: 'sum: requests',
  dataStreamedMetrics: 'sum: dataStreamed'
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
  if (!metricsDataset) return EMPTY_RESULT
  const { tsRangeBegin, tsRangeEnd } = normalizeTsBounds(tsRange)
  const statusFilters = { gte: null, lte: null, gt: null, lt: null }
  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    const match = key.match(/^status(Gte|Lte|Gt|Lt)$/)
    if (match) statusFilters[match[1].toLowerCase()] = Number(value)
  })
  const {
    fragments: extraFilterFragments,
    declarations: extraParamDeclarations,
    variables: extraVariables
  } = buildMetricsInlineFilter(filters, { skipStatus: true })
  const extraFilterStr = toInlineSuffix(extraFilterFragments)
  const extraParamsStr = toInlineSuffix(extraParamDeclarations)
  const aliasQuery = STATUS_METRICS_ALIASES.map(({ alias, rangeBegin, rangeEnd }) => {
    let effectiveBegin = rangeBegin
    let effectiveEnd = rangeEnd
    if (statusFilters.gte !== null) effectiveBegin = Math.max(effectiveBegin, statusFilters.gte)
    if (statusFilters.gt !== null) effectiveBegin = Math.max(effectiveBegin, statusFilters.gt + 1)
    if (statusFilters.lte !== null) effectiveEnd = Math.min(effectiveEnd, statusFilters.lte)
    if (statusFilters.lt !== null) effectiveEnd = Math.min(effectiveEnd, statusFilters.lt - 1)
    if (effectiveBegin > effectiveEnd) return ''
    return `
      ${alias}: ${metricsDataset}(
        limit: 10000, aggregate: { sum: requests }, groupBy: [ts], orderBy: [ts_ASC]
        filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end }, statusRange: { begin: ${effectiveBegin}, end: ${effectiveEnd} }${extraFilterStr} }
      ) { ts, sum }`
  }).join('')
  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {${aliasQuery} }`,
    variables: { tsRange_begin: tsRangeBegin, tsRange_end: tsRangeEnd, ...extraVariables }
  }
  const response = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: makeBeholderBaseUrl(),
    method: 'POST',
    body: JSON.stringify(query)
  })
  if (response.statusCode !== 200) throw new Error(response.body?.detail || 'Metrics API error')
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

async function loadRequestMethodChartFromMetricsApi({ dataset, tsRange, filters = {} }) {
  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset) return EMPTY_RESULT
  const { tsRangeBegin, tsRangeEnd } = normalizeTsBounds(tsRange)
  const {
    fragments: extraFilterFragments,
    declarations: extraParamDeclarations,
    variables: extraVariables
  } = buildMetricsInlineFilter(filters)
  const variables = { tsRange_begin: tsRangeBegin, tsRange_end: tsRangeEnd, ...extraVariables }
  const extraFilterStr = toInlineSuffix(extraFilterFragments)
  const extraParamsStr = toInlineSuffix(extraParamDeclarations)
  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {
      ${metricsDataset} ( limit: 10000, aggregate: { sum: requests }, groupBy: [ts, requestMethod], orderBy: [ts_ASC]
        filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end }${extraFilterStr} }
      ) { ts, requestMethod, sum } }`,
    variables
  }
  const response = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: makeBeholderBaseUrl(),
    method: 'POST',
    body: JSON.stringify(query)
  })
  if (response.statusCode !== 200) throw new Error(response.body?.detail || 'Metrics API error')
  const rawData = response.body?.data?.[metricsDataset]
  if (!rawData || !Array.isArray(rawData)) return { chartData: [], kpis: null }
  // Pre-group rows by classified method bucket, then fold per-ts through the
  // shared pivot routine (task 11.2). accumulate sums duplicate (ts, bucket)
  // pairs; sort orders chronologically. No backfill — a ts only carries the
  // buckets that appeared for it, matching the previous inline loop.
  const bucketGroups = new Map()
  rawData.forEach((item) => {
    if (!item?.ts) return
    const method = String(item.requestMethod || 'OTHER').toUpperCase()
    const bucket = REQUEST_METHOD_BUCKETS.includes(method) ? method : 'OTHER'
    if (!bucketGroups.has(bucket)) bucketGroups.set(bucket, [])
    bucketGroups.get(bucket).push(item)
  })
  const chartData = pivotTimeseries(
    Array.from(bucketGroups, ([key, rows]) => ({ key, rows })),
    { pickValue: (row) => row.sum || 0, accumulate: true, sort: true }
  )
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

async function loadCacheStatusChartFromMetricsApi({ dataset, tsRange, filters = {} }) {
  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset) return EMPTY_RESULT
  const { tsRangeBegin, tsRangeEnd } = normalizeTsBounds(tsRange)
  const metricsAggregate = METRICS_AGGREGATE_MAP[metricsDataset] || 'sum: requests'
  const aggReturnField = metricsAggregate.startsWith('count') ? 'count' : 'sum'
  const {
    fragments: extraFilterFragments,
    declarations: extraParamDeclarations,
    variables: extraVariables
  } = buildMetricsInlineFilter(filters)
  const variables = { tsRange_begin: tsRangeBegin, tsRange_end: tsRangeEnd, ...extraVariables }
  const extraFilterStr = toInlineSuffix(extraFilterFragments)
  const extraParamsStr = toInlineSuffix(extraParamDeclarations)
  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {
      ${metricsDataset} ( limit: 10000, aggregate: { ${metricsAggregate} }, groupBy: [ts, upstreamCacheStatus], orderBy: [ts_ASC]
        filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end }${extraFilterStr} }
      ) { ts, upstreamCacheStatus, ${aggReturnField} } }`,
    variables
  }
  const response = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: makeBeholderBaseUrl(),
    method: 'POST',
    body: JSON.stringify(query)
  })
  if (response.statusCode !== 200) throw new Error(response.body?.detail || 'Metrics API error')
  const rawData = response.body?.data?.[metricsDataset]
  if (!rawData || !Array.isArray(rawData)) return { chartData: [], kpis: null }
  // Pre-group rows by cache status, then fold per-ts through the shared pivot
  // routine (task 11.2). accumulate sums duplicate (ts, status) pairs; every
  // seen status is backfilled with 0 on every ts entry; sort orders
  // chronologically. `seenStatuses` preserves first-appearance order (matches
  // the previous `Array.from(seenStatuses)` backfill order).
  const statusGroups = new Map()
  const seenStatuses = []
  rawData.forEach((item) => {
    if (!item?.ts) return
    const status = String(item.upstreamCacheStatus || '-').toUpperCase()
    if (!statusGroups.has(status)) {
      statusGroups.set(status, [])
      seenStatuses.push(status)
    }
    statusGroups.get(status).push(item)
  })
  const chartData = pivotTimeseries(
    Array.from(statusGroups, ([key, rows]) => ({ key, rows })),
    {
      pickValue: (row) => row[aggReturnField] || 0,
      accumulate: true,
      backfill: true,
      backfillKeys: seenStatuses,
      sort: true
    }
  )
  const total = chartData.reduce(
    (sum, row) => sum + seenStatuses.reduce((ss, st) => ss + (row[st] || 0), 0),
    0
  )
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
  if (!tsRange?.tsRangeBegin || !tsRange?.tsRangeEnd) return EMPTY_RESULT

  const api = resolveChartApi(tsRange.tsRangeBegin, tsRange.tsRangeEnd)
  // `api` is an internal route selector ('events' | 'metrics'), not a secret.
  // eslint-disable-next-line security/detect-possible-timing-attacks
  if (api === 'events')
    return loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField })

  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset)
    return loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField })

  // Strip filter fields not supported by this Metrics dataset.
  // When fields are dropped, partialFilter=true tells the UI the chart total
  // does NOT reflect all active filters — the table count should be used instead.
  const { cleaned: metricsFilters, partial: partialFilter } = cleanBuiltFilterForMetrics(
    filters,
    metricsDataset
  )

  const tagPartial = (result) => {
    if (partialFilter) result.partialFilter = true
    return result
  }

  if (groupByField === 'status')
    return tagPartial(
      await loadStatusChartFromMetricsApi({ dataset, tsRange, filters: metricsFilters })
    )
  if (groupByField === 'requestMethod')
    return tagPartial(
      await loadRequestMethodChartFromMetricsApi({ dataset, tsRange, filters: metricsFilters })
    )
  if (groupByField === 'upstreamCacheStatus')
    return tagPartial(
      await loadCacheStatusChartFromMetricsApi({ dataset, tsRange, filters: metricsFilters })
    )
  if (groupByField) return loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField })

  // Default path — simple count grouped by ts
  const { tsRangeBegin, tsRangeEnd } = normalizeTsBounds(tsRange)
  const {
    fragments: extraFilterFragments,
    declarations: extraParamDeclarations,
    variables: extraVariables
  } = buildMetricsInlineFilter(metricsFilters, { skipStatus: true })
  const variables = { tsRange_begin: tsRangeBegin, tsRange_end: tsRangeEnd, ...extraVariables }
  const extraFilterStr = toInlineSuffix(extraFilterFragments)
  const extraParamsStr = toInlineSuffix(extraParamDeclarations)
  const metricsAggregate = METRICS_AGGREGATE_MAP[metricsDataset] || 'count: rows'
  const metricsReturnField = metricsAggregate.startsWith('count') ? 'count' : 'sum'
  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {
      ${metricsDataset} ( limit: 10000, aggregate: { ${metricsAggregate} }, groupBy: [ts], orderBy: [ts_ASC]
        filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end }${extraFilterStr} }
      ) { ts, ${metricsReturnField} } }`,
    variables
  }
  const response = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: makeBeholderBaseUrl(),
    method: 'POST',
    body: JSON.stringify(query)
  })
  if (response.statusCode !== 200) throw new Error(response.body?.detail || 'Metrics API error')
  const rawData = response.body?.data?.[metricsDataset]
  if (!rawData || !Array.isArray(rawData)) return tagPartial({ chartData: [], kpis: null })
  const chartData = rawData.map((item) => ({ ts: item.ts, count: item[metricsReturnField] || 0 }))
  const total = chartData.reduce((sum, item) => sum + (item.count || 0), 0)
  return tagPartial({
    chartData,
    kpis: {
      total,
      clientErrors: null,
      serverErrors: null,
      avgRequestTime: null,
      supportsStatusBreakdown: false,
      supportsRequestTime: false
    }
  })
}

const STACK_BUCKETS = {
  status: (raw) => {
    const sc = Number(raw)
    if (!Number.isFinite(sc)) return 'other'
    if (sc >= 200 && sc < 300) return '2xx'
    if (sc >= 300 && sc < 400) return '3xx'
    if (sc >= 400 && sc < 500) return '4xx'
    if (sc >= 500 && sc < 600) return '5xx'
    return 'other'
  },
  requestMethod: (raw) => {
    const method = String(raw || '').toUpperCase()
    return ['GET', 'POST', 'PUT', 'DELETE'].includes(method) ? method : 'other'
  },
  upstreamCacheStatus: (raw) => String(raw || '-').toUpperCase()
}

// Events/pivot bucket sizing now delegates to the SINGLE shared rule (task 11.6,
// req 5.7). The only events-path nuance kept here is the zero/negative-duration
// guard (→ 1 minute), which the shared table does not special-case. No cap is
// passed, so the shared lookup is exact for this path.
function pickBucketMs(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return 60 * 1000
  return getBucketInterval(durationMs)
}

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
    perTs.get(aligned)[bucket] = (perTs.get(aligned)[bucket] || 0) + (row.count || 0)
  })
  const buckets = Array.from(seenBuckets)
  const result = []
  perTs.forEach((entry) => {
    buckets.forEach((bn) => {
      if (entry[bn] === undefined) entry[bn] = 0
    })
    result.push(entry)
  })
  return result.sort((left, right) => new Date(left.ts) - new Date(right.ts))
}

const HTTP_LIKE_DATASETS = new Set(['workloadEvents'])

/**
 * Whitelist of groupBy fields each Events dataset can be safely grouped by.
 *
 * Mirrors `CURATED_DATASET_FIELDS` (`_shared/dataset-fields.js`) — the single
 * source of truth for which fields each dataset exposes. Only fields used as
 * `groupByField` in the UI stack-by selector are listed; non-stackable
 * datasets get an empty Set so any incoming groupByField is dropped before
 * reaching GraphQL.
 *
 * Rationale: GraphQL responds with "Cannot query field X" when a dataset is
 * grouped by a field it doesn't support, which fails the entire chart query.
 * The guard below downgrades the request to a time-series query instead.
 */
const DATASET_SUPPORTS_GROUPBY = Object.freeze({
  workloadEvents: new Set(['status', 'requestMethod', 'upstreamCacheStatus']),
  tieredCacheEvents: new Set(['upstreamCacheStatus']),
  functionEvents: new Set(),
  functionConsoleEvents: new Set(),
  imagesProcessedEvents: new Set(),
  edgeDnsQueriesEvents: new Set(),
  dataStreamedEvents: new Set(),
  activityHistoryEvents: new Set()
})

/**
 * Validate and (if needed) downgrade a groupByField against the dataset's
 * whitelist. Logs a structured warning when an unsupported field is dropped
 * so the issue is observable in production.
 *
 * @param {string} dataset
 * @param {string|null|undefined} groupByField
 * @param {string} site - call-site tag for diagnostics ('client' | 'service')
 * @returns {string|null} the original field if supported, otherwise null
 */
function sanitizeGroupByField(dataset, groupByField, site) {
  if (!groupByField) return null
  const supported = DATASET_SUPPORTS_GROUPBY[dataset]
  // Unknown dataset: pass-through (let the API surface the error).
  if (!supported) return groupByField
  if (supported.has(groupByField)) return groupByField
  // eslint-disable-next-line no-console
  console.warn(
    `[real-time-events] Dataset ${dataset} does not support groupBy:${groupByField}; falling back to ts-only`,
    {
      event: 'unsupported_groupby',
      site,
      dataset,
      field: groupByField,
      fallback: 'ts-only'
    }
  )
  return null
}

const STATUS_CHART_ALIASES = Object.freeze([
  { alias: 'chart2xx', bucket: '2xx', filter: 'statusGte: 200, statusLt: 300' },
  { alias: 'chart3xx', bucket: '3xx', filter: 'statusGte: 300, statusLt: 400' },
  { alias: 'chart4xx', bucket: '4xx', filter: 'statusGte: 400, statusLt: 500' },
  { alias: 'chart5xx', bucket: '5xx', filter: 'statusGte: 500, statusLt: 600' }
])

function mergeChartBucketAliases(data, aliasConfig) {
  const groups = aliasConfig.map(({ alias, bucket }) => ({
    key: bucket,
    rows: Array.isArray(data?.[alias]) ? data[alias] : []
  }))
  // Only backfill buckets that carried at least one count (matches the legacy
  // `totalsByBucket[bucket] > 0` gate; per-alias total, so buckets sharing an
  // alias keep the last alias's total as the legacy did).
  const totalsByBucket = {}
  groups.forEach(({ key, rows }) => {
    totalsByBucket[key] = rows.reduce(
      (sum, row) => (row?.ts ? sum + (Number(row.count) || 0) : sum),
      0
    )
  })
  const activeBuckets = aliasConfig
    .map(({ bucket }) => bucket)
    .filter((bucket) => (totalsByBucket[bucket] || 0) > 0)
  return pivotTimeseries(groups, {
    pickValue: (row) => Number(row.count) || 0,
    tsKeyOf: (row) => String(row.ts),
    accumulate: true,
    backfill: true,
    backfillKeys: activeBuckets,
    sort: true
  })
}

/**
 * Build the KPI alias fragments for the Events-API query.
 * Returns empty strings for non-HTTP-like datasets.
 *
 * @param {{ dataset: string, filterBlock: string }} args
 * @returns {{ kpiStatusAlias: string, kpiAvgAlias: string }}
 */
function buildKpiAliases({ dataset, filterBlock }) {
  const isHttpLike = HTTP_LIKE_DATASETS.has(dataset)
  const kpiStatusAlias = isHttpLike
    ? `
    kpiByStatus: ${dataset}( limit: 10000, aggregate: { count: rows }, groupBy: [status], filter: { ${filterBlock} } ) { count, status }`
    : ''
  const kpiAvgAlias = isHttpLike
    ? `
    kpiAvgRt: ${dataset}( limit: 1, aggregate: { avg: requestTime }, filter: { ${filterBlock} } ) { avg }`
    : ''
  return { kpiStatusAlias, kpiAvgAlias }
}

async function loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField = null }) {
  // Task 10.2 — client-side guard: drop unsupported groupByField up-front so
  // we never build a query GraphQL is guaranteed to reject. Downgrades to a
  // ts-only time-series instead of failing the whole chart.
  let effectiveGroupByField = sanitizeGroupByField(dataset, groupByField, 'client')

  const normalizedTsRange = normalizeTsBounds(tsRange)
  const isHttpLike = HTTP_LIKE_DATASETS.has(dataset)
  const hasExplicitStatusFilter = filterMentionsField(filters, 'status')
  // Task 10.3 — defense-in-depth: re-check at query-build time. If anything
  // between the entry guard and this point reassigned `effectiveGroupByField`
  // (refactor risk), we still drop the unsupported field before assembling
  // the query.
  effectiveGroupByField = sanitizeGroupByField(dataset, effectiveGroupByField, 'service')
  const isBucketedStatusStack =
    effectiveGroupByField === 'status' && isHttpLike && !hasExplicitStatusFilter
  const chartGroupBy =
    effectiveGroupByField && !isBucketedStatusStack ? ['ts', effectiveGroupByField] : ['ts']
  const variables = { tsBegin: normalizedTsRange.tsRangeBegin, tsEnd: normalizedTsRange.tsRangeEnd }
  const {
    fragments: extraFilterLines,
    declarations: extraParamDecls,
    variables: filterVars
  } = buildFilterParts(filters, 'flt')
  Object.assign(variables, filterVars)
  const paramsStr = ['$tsBegin: DateTime!', '$tsEnd: DateTime!', ...extraParamDecls].join(', ')
  const filterBlock = ['tsRange: { begin: $tsBegin, end: $tsEnd }', ...extraFilterLines].join(', ')
  const chartAlias = isBucketedStatusStack
    ? STATUS_CHART_ALIASES.map(
        ({ alias, filter }) => `
    ${alias}: ${dataset}( limit: 10000, aggregate: { count: rows }, groupBy: [ts], orderBy: [ts_ASC], filter: { ${filterBlock}, ${filter} } ) { count, ts }`
      ).join('')
    : `
    chart: ${dataset}( limit: 10000, aggregate: { count: rows }, groupBy: [${chartGroupBy.join(', ')}], orderBy: [ts_ASC], filter: { ${filterBlock} } ) {
      ${['count', ...chartGroupBy].join('\n      ')}
    }`
  const { kpiStatusAlias, kpiAvgAlias } = buildKpiAliases({ dataset, filterBlock })
  const query = {
    query: `query (${paramsStr}) {${chartAlias}${kpiStatusAlias}${kpiAvgAlias}\n}`,
    variables
  }
  const decorator = new AxiosHttpClientSignalDecorator()
  let httpResponse
  try {
    httpResponse = await decorator.request({
      baseURL: '/',
      url: makeRealTimeEventsBaseUrl(),
      method: 'POST',
      body: JSON.stringify(query)
    })
  } catch (err) {
    // Task 11.1 — log raw error with structured context; rethrow so the
    // caller (useEventsData.loadChart) surfaces the user-facing toast.
    // eslint-disable-next-line no-console
    console.error('[real-time-events] GraphQL query failed', {
      event: 'graphql_error',
      dataset,
      groupByField: effectiveGroupByField,
      error: err?.message || String(err),
      timestamp: new Date().toISOString()
    })
    throw err
  }
  if (httpResponse.statusCode !== 200) {
    // eslint-disable-next-line no-console
    console.error('[real-time-events] GraphQL non-200 response', {
      event: 'graphql_error',
      dataset,
      groupByField: effectiveGroupByField,
      statusCode: httpResponse.statusCode,
      detail: httpResponse.body?.detail,
      timestamp: new Date().toISOString()
    })
    throw new Error(httpResponse.body?.detail || 'Aggregation API error')
  }
  const data = httpResponse.body?.data || {}
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
    chartData = effectiveGroupByField
      ? pivotGroupedRows(chartRows, effectiveGroupByField, normalizedTsRange)
      : chartRows
  }
  let kpis = {
    total: chartData.reduce((sum, row) => {
      if (typeof row.count === 'number') return sum + row.count
      let rowTotal = 0
      Object.entries(row).forEach(([fn, fv]) => {
        if (fn !== 'ts' && typeof fv === 'number') rowTotal += fv
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
    kpis = { ...kpis, total, clientErrors: c4xx, serverErrors: c5xx, supportsStatusBreakdown: true }
  }
  if (isHttpLike && Array.isArray(data.kpiAvgRt) && data.kpiAvgRt[0]?.avg !== undefined) {
    const avg = Number(data.kpiAvgRt[0].avg)
    kpis.avgRequestTime = Number.isFinite(avg) ? avg : null
    kpis.supportsRequestTime = kpis.avgRequestTime !== null
  }
  return { chartData, kpis }
}

/**
 * Fallback KPI loader used ONLY when the chart request routed through the
 * Metrics API (i.e. when resolveChartApi returned 'metrics'). In that case
 * loadEventsChartAggregation cannot attach the Events-API KPI aliases to its
 * query, so this function issues a dedicated kpi-only Events-API request for
 * kpiByStatus + kpiAvgRt.
 *
 * When the chart request goes through the Events API, this function is NOT
 * called — KPIs are already merged into the chart payload via the default
 * path, guaranteeing Chart_View invariance (Property 9).
 *
 * Returns null for datasets that do not declare showSummary: true or for
 * non-HTTP-like datasets.
 *
 * @param {{ dataset: string, tsRange: object, filters?: object, signal?: AbortSignal }} args
 * @returns {Promise<{total: number, clientErrors: number, serverErrors: number, avgRequestTime: number|null, supportsStatusBreakdown: boolean, supportsRequestTime: boolean}|null>}
 */
/**
 * Load KPIs via the Metrics API (Beholder). Used for large time ranges
 * that exceed the Events API 2h window limit.
 * Provides status breakdown (4xx/5xx counts) but not avgRequestTime
 * (not supported by Metrics API).
 */
async function loadSummaryKpisFromMetrics({ dataset, tsRange, filters = {} }) {
  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset) return null

  const { cleaned: metricsFilters } = cleanBuiltFilterForMetrics(filters, metricsDataset)

  const { tsRangeBegin, tsRangeEnd } = normalizeTsBounds(tsRange)

  const statusFilters = { gte: null, lte: null, gt: null, lt: null }
  Object.entries(metricsFilters?.and || {}).forEach(([key, value]) => {
    const match = key.match(/^status(Gte|Lte|Gt|Lt)$/)
    if (match) statusFilters[match[1].toLowerCase()] = Number(value)
  })

  const {
    fragments: extraFilterFragments,
    declarations: extraParamDeclarations,
    variables: extraVariables
  } = buildMetricsInlineFilter(metricsFilters, { skipStatus: true })

  const extraFilterStr = toInlineSuffix(extraFilterFragments)
  const extraParamsStr = toInlineSuffix(extraParamDeclarations)

  // Build aliased queries for each status bucket
  const aliasQuery = STATUS_METRICS_ALIASES.map(({ alias, rangeBegin, rangeEnd }) => {
    let effectiveBegin = rangeBegin
    let effectiveEnd = rangeEnd
    if (statusFilters.gte !== null) effectiveBegin = Math.max(effectiveBegin, statusFilters.gte)
    if (statusFilters.gt !== null) effectiveBegin = Math.max(effectiveBegin, statusFilters.gt + 1)
    if (statusFilters.lte !== null) effectiveEnd = Math.min(effectiveEnd, statusFilters.lte)
    if (statusFilters.lt !== null) effectiveEnd = Math.min(effectiveEnd, statusFilters.lt - 1)
    if (effectiveBegin > effectiveEnd) return ''
    return `
      ${alias}: ${metricsDataset}(
        limit: 1, aggregate: { sum: requests },
        filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end }, statusRange: { begin: ${effectiveBegin}, end: ${effectiveEnd} }${extraFilterStr} }
      ) { sum }`
  })
    .filter(Boolean)
    .join('')

  if (!aliasQuery) {
    return {
      total: 0,
      clientErrors: 0,
      serverErrors: 0,
      avgRequestTime: null,
      supportsStatusBreakdown: true,
      supportsRequestTime: false
    }
  }

  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {${aliasQuery} }`,
    variables: { tsRange_begin: tsRangeBegin, tsRange_end: tsRangeEnd, ...extraVariables }
  }

  try {
    const response = await AxiosHttpClientAdapter.request({
      baseURL: '/',
      url: makeBeholderBaseUrl(),
      method: 'POST',
      body: JSON.stringify(query)
    })
    if (response.statusCode !== 200) return null

    const responseData = response.body?.data || {}
    const counts = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 }
    STATUS_METRICS_ALIASES.forEach(({ alias, bucket }) => {
      const rows = Array.isArray(responseData[alias]) ? responseData[alias] : []
      const sum = rows.reduce((acc, row) => acc + (row?.sum || 0), 0)
      counts[bucket] = sum
    })
    const total = counts['2xx'] + counts['3xx'] + counts['4xx'] + counts['5xx']
    return {
      total,
      clientErrors: counts['4xx'],
      serverErrors: counts['5xx'],
      avgRequestTime: null,
      supportsStatusBreakdown: true,
      supportsRequestTime: false
    }
  } catch {
    return null
  }
}

export async function loadSummaryKpis({ dataset, tsRange, filters = {}, signal }) {
  // Only HTTP-like datasets support KPI breakdown
  if (!HTTP_LIKE_DATASETS.has(dataset)) return null
  if (!tsRange?.tsRangeBegin || !tsRange?.tsRangeEnd) return null

  // Route to Metrics API for large ranges (Events API has a 2h window limit)
  const api = resolveChartApi(tsRange.tsRangeBegin, tsRange.tsRangeEnd)
  // `api` is an internal route selector ('events' | 'metrics'), not a secret.
  // eslint-disable-next-line security/detect-possible-timing-attacks
  if (api === 'metrics') {
    return loadSummaryKpisFromMetrics({ dataset, tsRange, filters })
  }

  const normalizedTsRange = normalizeTsBounds(tsRange)

  const variables = { tsBegin: normalizedTsRange.tsRangeBegin, tsEnd: normalizedTsRange.tsRangeEnd }
  const {
    fragments: extraFilterLines,
    declarations: extraParamDecls,
    variables: filterVars
  } = buildFilterParts(filters, 'flt')
  Object.assign(variables, filterVars)

  const paramsStr = ['$tsBegin: DateTime!', '$tsEnd: DateTime!', ...extraParamDecls].join(', ')
  const filterBlock = ['tsRange: { begin: $tsBegin, end: $tsEnd }', ...extraFilterLines].join(', ')

  const { kpiStatusAlias, kpiAvgAlias } = buildKpiAliases({ dataset, filterBlock })

  const query = {
    query: `query (${paramsStr}) {${kpiStatusAlias}${kpiAvgAlias}\n}`,
    variables
  }

  const decorator = new AxiosHttpClientSignalDecorator(signal)
  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: JSON.stringify(query)
  })

  if (httpResponse.statusCode !== 200) {
    throw new Error(httpResponse.body?.detail || 'KPI API error')
  }

  const data = httpResponse.body?.data || {}

  let total = 0
  let clientErrors = 0
  let serverErrors = 0
  let avgRequestTime = null
  let supportsStatusBreakdown = false
  let supportsRequestTime = false

  if (Array.isArray(data.kpiByStatus)) {
    const classify = STACK_BUCKETS.status
    data.kpiByStatus.forEach((row) => {
      const bucket = classify(row?.status)
      const count = row?.count || 0
      total += count
      if (bucket === '4xx') clientErrors += count
      else if (bucket === '5xx') serverErrors += count
    })
    supportsStatusBreakdown = true
  }

  if (Array.isArray(data.kpiAvgRt) && data.kpiAvgRt[0]?.avg !== undefined) {
    const avg = Number(data.kpiAvgRt[0].avg)
    avgRequestTime = Number.isFinite(avg) ? avg : null
    supportsRequestTime = avgRequestTime !== null
  }

  return {
    total,
    clientErrors,
    serverErrors,
    avgRequestTime,
    supportsStatusBreakdown,
    supportsRequestTime
  }
}

export default loadEventsAggregation
