import { convertGQLAggregation } from '@/helpers/convert-gql-aggregation'
import { AxiosHttpClientSignalDecorator } from '../axios/AxiosHttpClientSignalDecorator'
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeRealTimeEventsBaseUrl } from './make-real-time-events-service'
import { makeBeholderBaseUrl } from '../real-time-metrics-services/make-beholder-base-url'
import * as Errors from '@/services/axios/errors'
import { resolveChartApi } from './chart-api-router'

function inferArrayType(arr) {
  if (!Array.isArray(arr) || !arr.length) return '[String]'
  const sample = arr[0]
  if (typeof sample === 'number') return Number.isInteger(sample) ? '[Int]' : '[Float]'
  return '[String]'
}

function normalizeInFilterValues(values) {
  if (!Array.isArray(values)) return values
  return values.map((item) => {
    const raw = item?.value !== undefined ? item.value : item
    return String(raw)
  })
}

export const loadEventsAggregation = async ({
  dataset, tsRange, groupBy = ['ts'], aggregation = { count: 'rows' }, filters = {}, limit = 10000
}) => {
  if (!tsRange?.tsRangeBegin || !tsRange?.tsRangeEnd) return []
  const orderBy = groupBy.length === 0
    ? undefined
    : groupBy.includes('ts') ? 'ts_ASC' : `${Object.keys(aggregation)[0]}_DESC`
  const payload = convertGQLAggregation({
    dataset, tsRange, groupBy, aggregation, filters, limit, orderBy
  })
  const decorator = new AxiosHttpClientSignalDecorator()
  const httpResponse = await decorator.request({
    baseURL: '/', url: makeRealTimeEventsBaseUrl(), method: 'POST', body: payload
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
    case 200: return adaptResponse(body, dataset)
    case 400: throw new Error(body.detail || 'Bad Request')
    case 401: throw new Errors.InvalidApiTokenError().message
    case 403: throw new Error(body.detail || 'Forbidden')
    case 404: throw new Errors.NotFoundError().message
    case 500: throw new Errors.InternalServerError().message
    default: throw new Errors.UnexpectedError().message
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
  dataStreamedMetrics: 'sum: dataStreamed',
}

const EMPTY_RESULT = Object.freeze({ chartData: [], kpis: null })

/**
 * Fields accepted as filter arguments by each Metrics dataset.
 * Source: https://www.azion.com/en/documentation/devtools/graphql-api/features/gql-real-time-metrics-fields/
 *
 * Fields NOT in this set (e.g. httpUserAgent, requestUri, remoteAddress) are
 * stripped before building the Metrics query. The chart renders with the
 * supported filters; the kpis.partialFilter flag tells the UI not to use the
 * chart total as "Documents found".
 */
const METRICS_FILTER_FIELDS = {
  httpMetrics: new Set([
    'bytesSent', 'configurationId', 'geolocCountryName', 'geolocRegionName',
    'host', 'proxyStatus', 'remoteAddressClass', 'requestLength', 'requestMethod',
    'requestTime', 'requests', 'scheme', 'sentHttpXOriginalImageSize',
    'serverProtocol', 'sourceLocPop', 'sslProtocol', 'status',
    'upstreamBytesReceived', 'upstreamCacheStatus', 'upstreamResponseTime',
    'upstreamStatus', 'wafAttackFamily', 'wafBlock', 'wafLearning'
  ]),
  edgeFunctionsMetrics: new Set([
    'computeTime', 'configurationId', 'edgeFunctionId', 'edgeFunctionInstanceId',
    'edgeFunctionsInstanceIdList', 'functionLanguage', 'initiatorType',
    'invocations', 'sourceLocPop'
  ]),
  imagesProcessedMetrics: new Set([
    'bytesSent', 'configurationId', 'host', 'remoteAddressClass',
    'requestMethod', 'requestTime', 'requests', 'scheme', 'sourceLocPop',
    'status', 'upstreamCacheStatus', 'upstreamResponseTime', 'upstreamStatus'
  ]),
  l2CacheMetrics: new Set([
    'bytesSent', 'configurationId', 'host', 'proxyStatus', 'remoteAddressClass',
    'requestLength', 'requestMethod', 'requestTime', 'requests', 'scheme',
    'sourceLocPop', 'status', 'upstreamBytesReceived', 'upstreamCacheStatus',
    'upstreamResponseTime', 'upstreamStatus'
  ]),
  idnsQueriesMetrics: new Set(['qtype', 'requests', 'sourceLocPop', 'zoneId']),
  dataStreamedMetrics: new Set([
    'configurationId', 'dataStreamed', 'endpointType', 'requests',
    'sourceLocPop', 'streamedLines'
  ])
}

function extractBaseField(filterKey) {
  return filterKey.replace(/(Eq|Ne|Like|Ilike|Gte|Gt|Lte|Lt|In|Range|Contains)$/, '')
}

function filterForMetrics(filters, metricsDataset) {
  const allowed = METRICS_FILTER_FIELDS[metricsDataset]
  if (!allowed) return { cleaned: filters, partial: false }
  let partial = false
  const cleaned = {}
  if (filters?.and) {
    const kept = {}
    Object.entries(filters.and).forEach(([key, value]) => {
      if (allowed.has(extractBaseField(key))) { kept[key] = value } else { partial = true }
    })
    if (Object.keys(kept).length) cleaned.and = kept
  }
  if (filters?.in) {
    const kept = {}
    Object.entries(filters.in).forEach(([key, value]) => {
      if (allowed.has(extractBaseField(key))) { kept[key] = value } else { partial = true }
    })
    if (Object.keys(kept).length) cleaned.in = kept
  }
  return { cleaned, partial }
}

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
      accumulator.total += (row['2xx'] || 0) + (row['3xx'] || 0) + (row['4xx'] || 0) + (row['5xx'] || 0)
      accumulator.clientErrors += row['4xx'] || 0
      accumulator.serverErrors += row['5xx'] || 0
      return accumulator
    },
    { total: 0, clientErrors: 0, serverErrors: 0 }
  )
  return {
    total: totals.total, clientErrors: totals.clientErrors, serverErrors: totals.serverErrors,
    avgRequestTime: null, p95RequestTime: null, p99RequestTime: null,
    supportsStatusBreakdown: true, supportsRequestTime: false
  }
}

async function loadStatusChartFromMetricsApi({ dataset, tsRange, filters = {} }) {
  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset) return EMPTY_RESULT
  const tsRangeBegin = tsRange.tsRangeBegin instanceof Date ? tsRange.tsRangeBegin.toISOString() : String(tsRange.tsRangeBegin)
  const tsRangeEnd = tsRange.tsRangeEnd instanceof Date ? tsRange.tsRangeEnd.toISOString() : String(tsRange.tsRangeEnd)
  const statusFilters = { gte: null, lte: null, gt: null, lt: null }
  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    const match = key.match(/^status(Gte|Lte|Gt|Lt)$/)
    if (match) statusFilters[match[1].toLowerCase()] = Number(value)
  })
  const extraFilterFragments = []
  const extraVariables = {}
  const extraParamDeclarations = []
  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    if (!key.startsWith('status')) {
      const varName = `filter_${key}`
      extraVariables[varName] = value
      extraFilterFragments.push(`${key}: $${varName}`)
      extraParamDeclarations.push(`$${varName}: ${typeof value === 'number' ? 'Int' : 'String'}`)
    }
  })
  Object.entries(filters?.in || {}).forEach(([key, value]) => {
    if (!key.startsWith('status')) {
      const varName = `in_${key}`
      const normalized = normalizeInFilterValues(value)
      extraVariables[varName] = normalized
      const gqlKey = key.endsWith('In') ? key : `${key}In`
      extraFilterFragments.push(`${gqlKey}: $${varName}`)
      extraParamDeclarations.push(`$${varName}: ${inferArrayType(normalized)}`)
    }
  })
  const extraFilterStr = extraFilterFragments.length > 0 ? `, ${extraFilterFragments.join(', ')}` : ''
  const extraParamsStr = extraParamDeclarations.length > 0 ? `, ${extraParamDeclarations.join(', ')}` : ''
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
  const response = await AxiosHttpClientAdapter.request({ baseURL: '/', url: makeBeholderBaseUrl(), method: 'POST', body: JSON.stringify(query) })
  if (response.statusCode !== 200) throw new Error(response.body?.detail || 'Metrics API error')
  const responseData = response.body?.data || {}
  const normalizedBuckets = {}
  STATUS_METRICS_ALIASES.forEach(({ alias }) => {
    normalizedBuckets[alias] = Array.isArray(responseData[alias])
      ? responseData[alias].map((item) => ({ ts: item.ts, count: item.sum || 0 })) : []
  })
  const chartData = mergeChartBucketAliases(normalizedBuckets, STATUS_METRICS_ALIASES)
  return { chartData, kpis: buildMetricsKpisFromStatusChart(chartData) }
}

async function loadRequestMethodChartFromMetricsApi({ dataset, tsRange, filters = {} }) {
  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset) return EMPTY_RESULT
  const tsRangeBegin = tsRange.tsRangeBegin instanceof Date ? tsRange.tsRangeBegin.toISOString() : String(tsRange.tsRangeBegin)
  const tsRangeEnd = tsRange.tsRangeEnd instanceof Date ? tsRange.tsRangeEnd.toISOString() : String(tsRange.tsRangeEnd)
  const extraFilterFragments = []
  const variables = { tsRange_begin: tsRangeBegin, tsRange_end: tsRangeEnd }
  const extraParamDeclarations = []
  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    const varName = `filter_${key}`; variables[varName] = value
    extraFilterFragments.push(`${key}: $${varName}`)
    extraParamDeclarations.push(`$${varName}: ${typeof value === 'number' ? 'Int' : 'String'}`)
  })
  Object.entries(filters?.in || {}).forEach(([key, value]) => {
    const varName = `in_${key}`; const normalized = normalizeInFilterValues(value); variables[varName] = normalized
    const gqlKey = key.endsWith('In') ? key : `${key}In`
    extraFilterFragments.push(`${gqlKey}: $${varName}`)
    extraParamDeclarations.push(`$${varName}: ${inferArrayType(normalized)}`)
  })
  const extraFilterStr = extraFilterFragments.length > 0 ? `, ${extraFilterFragments.join(', ')}` : ''
  const extraParamsStr = extraParamDeclarations.length > 0 ? `, ${extraParamDeclarations.join(', ')}` : ''
  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {
      ${metricsDataset} ( limit: 10000, aggregate: { sum: requests }, groupBy: [ts, requestMethod], orderBy: [ts_ASC]
        filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end }${extraFilterStr} }
      ) { ts, requestMethod, sum } }`,
    variables
  }
  const response = await AxiosHttpClientAdapter.request({ baseURL: '/', url: makeBeholderBaseUrl(), method: 'POST', body: JSON.stringify(query) })
  if (response.statusCode !== 200) throw new Error(response.body?.detail || 'Metrics API error')
  const rawData = response.body?.data?.[metricsDataset]
  if (!rawData || !Array.isArray(rawData)) return { chartData: [], kpis: null }
  const perTs = new Map()
  rawData.forEach((item) => {
    if (!item?.ts) return
    const method = String(item.requestMethod || 'OTHER').toUpperCase()
    const bucket = REQUEST_METHOD_BUCKETS.includes(method) ? method : 'OTHER'
    if (!perTs.has(item.ts)) perTs.set(item.ts, { ts: item.ts })
    const entry = perTs.get(item.ts)
    entry[bucket] = (entry[bucket] || 0) + (item.sum || 0)
  })
  const chartData = Array.from(perTs.values()).sort((left, right) => new Date(left.ts) - new Date(right.ts))
  const totals = chartData.reduce((acc, row) => {
    REQUEST_METHOD_BUCKETS.forEach((method) => { acc[method] = (acc[method] || 0) + (row[method] || 0) })
    acc.OTHER = (acc.OTHER || 0) + (row.OTHER || 0); return acc
  }, {})
  const total = Object.values(totals).reduce((sum, val) => sum + val, 0)
  return { chartData, kpis: { total, clientErrors: null, serverErrors: null, avgRequestTime: null, supportsStatusBreakdown: false, supportsRequestTime: false } }
}

async function loadCacheStatusChartFromMetricsApi({ dataset, tsRange, filters = {} }) {
  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset) return EMPTY_RESULT
  const tsRangeBegin = tsRange.tsRangeBegin instanceof Date ? tsRange.tsRangeBegin.toISOString() : String(tsRange.tsRangeBegin)
  const tsRangeEnd = tsRange.tsRangeEnd instanceof Date ? tsRange.tsRangeEnd.toISOString() : String(tsRange.tsRangeEnd)
  const metricsAggregate = METRICS_AGGREGATE_MAP[metricsDataset] || 'sum: requests'
  const aggReturnField = metricsAggregate.startsWith('count') ? 'count' : 'sum'
  const extraFilterFragments = []
  const variables = { tsRange_begin: tsRangeBegin, tsRange_end: tsRangeEnd }
  const extraParamDeclarations = []
  Object.entries(filters?.and || {}).forEach(([key, value]) => {
    const varName = `filter_${key}`; variables[varName] = value
    extraFilterFragments.push(`${key}: $${varName}`)
    extraParamDeclarations.push(`$${varName}: ${typeof value === 'number' ? 'Int' : 'String'}`)
  })
  Object.entries(filters?.in || {}).forEach(([key, value]) => {
    const varName = `in_${key}`; const normalized = normalizeInFilterValues(value); variables[varName] = normalized
    const gqlKey = key.endsWith('In') ? key : `${key}In`
    extraFilterFragments.push(`${gqlKey}: $${varName}`)
    extraParamDeclarations.push(`$${varName}: ${inferArrayType(normalized)}`)
  })
  const extraFilterStr = extraFilterFragments.length ? `, ${extraFilterFragments.join(', ')}` : ''
  const extraParamsStr = extraParamDeclarations.length ? `, ${extraParamDeclarations.join(', ')}` : ''
  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {
      ${metricsDataset} ( limit: 10000, aggregate: { ${metricsAggregate} }, groupBy: [ts, upstreamCacheStatus], orderBy: [ts_ASC]
        filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end }${extraFilterStr} }
      ) { ts, upstreamCacheStatus, ${aggReturnField} } }`,
    variables
  }
  const response = await AxiosHttpClientAdapter.request({ baseURL: '/', url: makeBeholderBaseUrl(), method: 'POST', body: JSON.stringify(query) })
  if (response.statusCode !== 200) throw new Error(response.body?.detail || 'Metrics API error')
  const rawData = response.body?.data?.[metricsDataset]
  if (!rawData || !Array.isArray(rawData)) return { chartData: [], kpis: null }
  const perTs = new Map()
  const seenStatuses = new Set()
  rawData.forEach((item) => {
    if (!item?.ts) return
    const status = String(item.upstreamCacheStatus || '-').toUpperCase()
    seenStatuses.add(status)
    if (!perTs.has(item.ts)) perTs.set(item.ts, { ts: item.ts })
    perTs.get(item.ts)[status] = (perTs.get(item.ts)[status] || 0) + (item[aggReturnField] || 0)
  })
  const allStatuses = Array.from(seenStatuses)
  for (const row of perTs.values()) { for (const st of allStatuses) { if (!(st in row)) row[st] = 0 } }
  const chartData = Array.from(perTs.values()).sort((itemA, itemB) => new Date(itemA.ts) - new Date(itemB.ts))
  const total = chartData.reduce((sum, row) => sum + allStatuses.reduce((ss, st) => ss + (row[st] || 0), 0), 0)
  return { chartData, kpis: { total, clientErrors: null, serverErrors: null, avgRequestTime: null, supportsStatusBreakdown: false, supportsRequestTime: false } }
}

export const loadEventsChartAggregation = async ({ dataset, tsRange, filters = {}, groupByField = null }) => {
  if (!tsRange?.tsRangeBegin || !tsRange?.tsRangeEnd) return EMPTY_RESULT

  const api = resolveChartApi(tsRange.tsRangeBegin, tsRange.tsRangeEnd)
  if (api === 'events') return loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField })

  const metricsDataset = METRICS_DATASET_MAP[dataset]
  if (!metricsDataset) return loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField })

  // Strip filter fields not supported by this Metrics dataset.
  // When fields are dropped, partialFilter=true tells the UI the chart total
  // does NOT reflect all active filters — the table count should be used instead.
  const { cleaned: metricsFilters, partial: partialFilter } = filterForMetrics(filters, metricsDataset)

  const tagPartial = (result) => {
    if (partialFilter) result.partialFilter = true
    return result
  }

  if (groupByField === 'status') return tagPartial(await loadStatusChartFromMetricsApi({ dataset, tsRange, filters: metricsFilters }))
  if (groupByField === 'requestMethod') return tagPartial(await loadRequestMethodChartFromMetricsApi({ dataset, tsRange, filters: metricsFilters }))
  if (groupByField === 'upstreamCacheStatus') return tagPartial(await loadCacheStatusChartFromMetricsApi({ dataset, tsRange, filters: metricsFilters }))
  if (groupByField) return loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField })

  // Default path — simple count grouped by ts
  const tsRangeBegin = tsRange.tsRangeBegin instanceof Date ? tsRange.tsRangeBegin.toISOString() : String(tsRange.tsRangeBegin)
  const tsRangeEnd = tsRange.tsRangeEnd instanceof Date ? tsRange.tsRangeEnd.toISOString() : String(tsRange.tsRangeEnd)
  const extraFilterFragments = []
  const extraParamDeclarations = []
  const variables = { tsRange_begin: tsRangeBegin, tsRange_end: tsRangeEnd }
  Object.entries(metricsFilters?.and || {}).forEach(([key, value]) => {
    if (!key.startsWith('status')) {
      const varName = `filter_${key}`; variables[varName] = value
      extraFilterFragments.push(`${key}: $${varName}`)
      extraParamDeclarations.push(`$${varName}: ${typeof value === 'number' ? 'Int' : 'String'}`)
    }
  })
  Object.entries(metricsFilters?.in || {}).forEach(([key, value]) => {
    if (!key.startsWith('status')) {
      const varName = `in_${key}`; const normalized = normalizeInFilterValues(value); variables[varName] = normalized
      const gqlKey = key.endsWith('In') ? key : `${key}In`
      extraFilterFragments.push(`${gqlKey}: $${varName}`)
      extraParamDeclarations.push(`$${varName}: ${inferArrayType(normalized)}`)
    }
  })
  const extraFilterStr = extraFilterFragments.length > 0 ? `, ${extraFilterFragments.join(', ')}` : ''
  const extraParamsStr = extraParamDeclarations.length > 0 ? `, ${extraParamDeclarations.join(', ')}` : ''
  const metricsAggregate = METRICS_AGGREGATE_MAP[metricsDataset] || 'count: rows'
  const metricsReturnField = metricsAggregate.startsWith('count') ? 'count' : 'sum'
  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!${extraParamsStr}) {
      ${metricsDataset} ( limit: 10000, aggregate: { ${metricsAggregate} }, groupBy: [ts], orderBy: [ts_ASC]
        filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end }${extraFilterStr} }
      ) { ts, ${metricsReturnField} } }`,
    variables
  }
  const response = await AxiosHttpClientAdapter.request({ baseURL: '/', url: makeBeholderBaseUrl(), method: 'POST', body: JSON.stringify(query) })
  if (response.statusCode !== 200) throw new Error(response.body?.detail || 'Metrics API error')
  const rawData = response.body?.data?.[metricsDataset]
  if (!rawData || !Array.isArray(rawData)) return tagPartial({ chartData: [], kpis: null })
  const chartData = rawData.map((item) => ({ ts: item.ts, count: item[metricsReturnField] || 0 }))
  const total = chartData.reduce((sum, item) => sum + (item.count || 0), 0)
  return tagPartial({
    chartData,
    kpis: { total, clientErrors: null, serverErrors: null, avgRequestTime: null, supportsStatusBreakdown: false, supportsRequestTime: false }
  })
}

const STACK_BUCKETS = {
  status: (raw) => {
    const sc = Number(raw); if (!Number.isFinite(sc)) return 'other'
    if (sc >= 200 && sc < 300) return '2xx'; if (sc >= 300 && sc < 400) return '3xx'
    if (sc >= 400 && sc < 500) return '4xx'; if (sc >= 500 && sc < 600) return '5xx'; return 'other'
  },
  requestMethod: (raw) => {
    const method = String(raw || '').toUpperCase()
    return ['GET', 'POST', 'PUT', 'DELETE'].includes(method) ? method : 'other'
  },
  upstreamCacheStatus: (raw) => String(raw || '-').toUpperCase()
}

function pickBucketMs(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return 60 * 1000
  const SEC = 1000, MIN = 60 * SEC, HOUR = 60 * MIN, DAY = 24 * HOUR
  if (durationMs <= 1 * MIN) return 1 * SEC; if (durationMs <= 5 * MIN) return 5 * SEC
  if (durationMs <= 15 * MIN) return 10 * SEC; if (durationMs <= 30 * MIN) return 30 * SEC
  if (durationMs <= 1 * HOUR) return 1 * MIN; if (durationMs <= 3 * HOUR) return 5 * MIN
  if (durationMs <= 6 * HOUR) return 10 * MIN; if (durationMs <= 12 * HOUR) return 30 * MIN
  if (durationMs <= 1 * DAY) return 30 * MIN; if (durationMs <= 7 * DAY) return 3 * HOUR
  if (durationMs <= 30 * DAY) return 12 * HOUR; return 1 * DAY
}

function pivotGroupedRows(rows, groupByField, tsRange) {
  const classify = STACK_BUCKETS[groupByField]; if (!classify) return rows
  const beginMs = tsRange?.tsRangeBegin ? new Date(tsRange.tsRangeBegin).getTime() : NaN
  const endMs = tsRange?.tsRangeEnd ? new Date(tsRange.tsRangeEnd).getTime() : NaN
  const bucketMs = Number.isFinite(beginMs) && Number.isFinite(endMs) ? pickBucketMs(endMs - beginMs) : 0
  const perTs = new Map(); const seenBuckets = new Set()
  rows.forEach((row) => {
    if (!row?.ts) return
    const bucket = classify(row[groupByField]); seenBuckets.add(bucket)
    const tsMs = new Date(row.ts).getTime(); if (!Number.isFinite(tsMs)) return
    const aligned = bucketMs > 0 ? Math.floor(tsMs / bucketMs) * bucketMs : tsMs
    if (!perTs.has(aligned)) perTs.set(aligned, { ts: new Date(aligned).toISOString() })
    perTs.get(aligned)[bucket] = (perTs.get(aligned)[bucket] || 0) + (row.count || 0)
  })
  const buckets = Array.from(seenBuckets); const result = []
  perTs.forEach((entry) => { buckets.forEach((bn) => { if (entry[bn] === undefined) entry[bn] = 0 }); result.push(entry) })
  return result.sort((left, right) => new Date(left.ts) - new Date(right.ts))
}

const HTTP_LIKE_DATASETS = new Set(['workloadEvents'])
const STATUS_CHART_ALIASES = Object.freeze([
  { alias: 'chart2xx', bucket: '2xx', filter: 'statusGte: 200, statusLt: 300' },
  { alias: 'chart3xx', bucket: '3xx', filter: 'statusGte: 300, statusLt: 400' },
  { alias: 'chart4xx', bucket: '4xx', filter: 'statusGte: 400, statusLt: 500' },
  { alias: 'chart5xx', bucket: '5xx', filter: 'statusGte: 500, statusLt: 600' }
])

function mergeChartBucketAliases(data, aliasConfig) {
  const totalsByBucket = {}; const perTs = new Map()
  aliasConfig.forEach(({ alias, bucket }) => {
    const rows = Array.isArray(data?.[alias]) ? data[alias] : []; let bucketTotal = 0
    rows.forEach((row) => {
      if (!row?.ts) return; const count = Number(row.count) || 0; bucketTotal += count
      if (!perTs.has(String(row.ts))) perTs.set(String(row.ts), { ts: row.ts })
      perTs.get(String(row.ts))[bucket] = (perTs.get(String(row.ts))[bucket] || 0) + count
    })
    totalsByBucket[bucket] = bucketTotal
  })
  const activeBuckets = aliasConfig.map(({ bucket }) => bucket).filter((bucket) => (totalsByBucket[bucket] || 0) > 0)
  const result = []
  perTs.forEach((entry) => { activeBuckets.forEach((bucket) => { if (entry[bucket] === undefined) entry[bucket] = 0 }); result.push(entry) })
  return result.sort((left, right) => new Date(left.ts) - new Date(right.ts))
}

async function loadEventsChartFromEventsApi({ dataset, tsRange, filters, groupByField = null }) {
  const normalizedTsRange = {
    tsRangeBegin: tsRange.tsRangeBegin instanceof Date ? tsRange.tsRangeBegin.toISOString() : String(tsRange.tsRangeBegin),
    tsRangeEnd: tsRange.tsRangeEnd instanceof Date ? tsRange.tsRangeEnd.toISOString() : String(tsRange.tsRangeEnd)
  }
  const isHttpLike = HTTP_LIKE_DATASETS.has(dataset)
  const hasExplicitStatusFilter = !!(
    Object.keys(filters?.and || {}).some((key) => key.startsWith('status')) ||
    Object.keys(filters?.in || {}).some((key) => key.startsWith('status'))
  )
  const isBucketedStatusStack = groupByField === 'status' && isHttpLike && !hasExplicitStatusFilter
  const chartGroupBy = groupByField && !isBucketedStatusStack ? ['ts', groupByField] : ['ts']
  const variables = { tsBegin: normalizedTsRange.tsRangeBegin, tsEnd: normalizedTsRange.tsRangeEnd }
  const extraFilterLines = []
  if (filters?.and) {
    Object.entries(filters.and).forEach(([key, value]) => {
      const varName = `and_${key}`; variables[varName] = value
      extraFilterLines.push(`${key}: $${varName}`)
    })
  }
  if (filters?.in) {
    Object.entries(filters.in).forEach(([key, value]) => {
      const varName = `in_${key}`; const normalized = normalizeInFilterValues(value); variables[varName] = normalized
      const gqlKey = key.endsWith('In') ? key : `${key}In`
      extraFilterLines.push(`${gqlKey}: $${varName}`)
    })
  }
  const paramType = (key, value) => {
    if (key === 'tsBegin' || key === 'tsEnd') return 'DateTime!'
    if (Array.isArray(value)) { const sample = value[0]; if (typeof sample === 'number') return Number.isInteger(sample) ? '[Int]' : '[Float]'; return '[String]' }
    if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float'
    return 'String'
  }
  const paramsStr = Object.entries(variables).map(([key, value]) => `$${key}: ${paramType(key, value)}`).join(', ')
  const filterBlock = ['tsRange: { begin: $tsBegin, end: $tsEnd }', ...extraFilterLines].join(', ')
  const chartAlias = isBucketedStatusStack
    ? STATUS_CHART_ALIASES.map(({ alias, filter }) => `
    ${alias}: ${dataset}( limit: 10000, aggregate: { count: rows }, groupBy: [ts], orderBy: [ts_ASC], filter: { ${filterBlock}, ${filter} } ) { count, ts }`).join('')
    : `
    chart: ${dataset}( limit: 10000, aggregate: { count: rows }, groupBy: [${chartGroupBy.join(', ')}], orderBy: [ts_ASC], filter: { ${filterBlock} } ) {
      ${['count', ...chartGroupBy].join('\n      ')}
    }`
  const kpiStatusAlias = isHttpLike ? `
    kpiByStatus: ${dataset}( limit: 10000, aggregate: { count: rows }, groupBy: [status], filter: { ${filterBlock} } ) { count, status }` : ''
  const kpiAvgAlias = isHttpLike ? `
    kpiAvgRt: ${dataset}( limit: 1, aggregate: { avg: requestTime }, filter: { ${filterBlock} } ) { avg }` : ''
  const query = { query: `query (${paramsStr}) {${chartAlias}${kpiStatusAlias}${kpiAvgAlias}\n}`, variables }
  const decorator = new AxiosHttpClientSignalDecorator()
  const httpResponse = await decorator.request({ baseURL: '/', url: makeRealTimeEventsBaseUrl(), method: 'POST', body: JSON.stringify(query) })
  if (httpResponse.statusCode !== 200) throw new Error(httpResponse.body?.detail || 'Aggregation API error')
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
      Object.keys(item).forEach((key) => { if (!['count', 'ts'].includes(key)) normalized[key] = item[key] })
      return normalized
    })
    chartData = groupByField ? pivotGroupedRows(chartRows, groupByField, normalizedTsRange) : chartRows
  }
  let kpis = {
    total: chartData.reduce((sum, row) => {
      if (typeof row.count === 'number') return sum + row.count
      let rowTotal = 0
      Object.entries(row).forEach(([fn, fv]) => { if (fn !== 'ts' && typeof fv === 'number') rowTotal += fv })
      return sum + rowTotal
    }, 0),
    clientErrors: null, serverErrors: null, avgRequestTime: null,
    p95RequestTime: null, p99RequestTime: null, supportsStatusBreakdown: false, supportsRequestTime: false
  }
  if (isHttpLike && Array.isArray(data.kpiByStatus)) {
    const classify = STACK_BUCKETS.status; let total = 0; let c4xx = 0; let c5xx = 0
    data.kpiByStatus.forEach((row) => {
      const bucket = classify(row?.status); const count = row?.count || 0; total += count
      if (bucket === '4xx') c4xx += count; else if (bucket === '5xx') c5xx += count
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

export default loadEventsAggregation
