/**
 * metrics-chart-service.js
 *
 * Service layer for metrics chart data loading. Owns GraphQL query
 * construction and HTTP requests for the 4 loading strategies previously
 * embedded in useMetricsChart composable.
 *
 * Each function returns raw response data; the composable handles state
 * management, error wrapping, and UI concerns.
 */

import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeBeholderBaseUrl } from '@/services/real-time-metrics-services/make-beholder-base-url'
import { makeRealTimeEventsBaseUrl } from '@/services/real-time-events-service/make-real-time-events-service'

/**
 * Serialize a filter value as a GraphQL scalar literal. Mirrors the quoting
 * convention used by `FiltersToGraphQLString` in the Real-Time Metrics module:
 * the Events/Metrics backend rejects typed GraphQL variables for these fields,
 * so values are inlined as quoted strings / raw numbers.
 */
export const toGraphQLScalar = (value) => {
  if (Array.isArray(value)) return `[${value.map(toGraphQLScalar).join(', ')}]`
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value)
  const str = String(value).replace(/"/g, '\\"')
  return `"${str}"`
}

/**
 * Pivot grouped API rows into a format the chart builder understands.
 * Input:  [{ ts, classified: "Bad Bot", requests: 123 }, ...]
 * Output: [{ ts, "Bad Bot": 123, "Legit": 456 }]
 */
export function pivotGroupedData(rows, pivotField, aggVariable, { topN } = {}) {
  const tsMap = new Map()
  const categoryTotals = new Map()
  for (const row of rows) {
    const ts = row.ts
    const category = String(row[pivotField] ?? 'unknown')
    const value = row[aggVariable] ?? 0
    if (!tsMap.has(ts)) tsMap.set(ts, { ts })
    tsMap.get(ts)[category] = (tsMap.get(ts)[category] || 0) + value
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + value)
  }

  if (typeof topN === 'number' && topN > 0 && categoryTotals.size > topN) {
    const keepList = Array.from(categoryTotals.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, topN)
      .map(([category]) => category)
    const keep = new Set(keepList)
    for (const row of tsMap.values()) {
      for (const key of Object.keys(row)) {
        if (key === 'ts' || keep.has(key)) continue
        delete row[key]
      }
      for (const category of keepList) {
        if (!(category in row)) row[category] = 0
      }
    }
  } else {
    const allCategories = Array.from(categoryTotals.keys())
    for (const row of tsMap.values()) {
      for (const category of allCategories) {
        if (!(category in row)) row[category] = 0
      }
    }
  }
  return Array.from(tsMap.values())
}

/**
 * Issue a POST request to the given GraphQL endpoint.
 * @param {string} url - GraphQL endpoint URL
 * @param {Object} query - { query, variables }
 * @returns {Promise<{ statusCode: number, body: Object }>}
 */
async function graphqlRequest(url, query) {
  return AxiosHttpClientAdapter.request({
    baseURL: '/',
    url,
    method: 'POST',
    body: JSON.stringify(query)
  })
}

/**
 * Load chart data from the Metrics API for WAF/Bot fields returned as direct
 * columns (no aggregate clause) — e.g. wafRequestsXssAttacks.
 *
 * Used as fallback for eventsApi configs when the range exceeds 30 minutes.
 *
 * @param {Object} config - Chart config with `metricsApiFallback` property
 * @param {string} begin - ISO 8601 begin timestamp
 * @param {string} end - ISO 8601 end timestamp
 * @returns {Promise<Array>} Chart data rows
 * @throws {Object} { reason, detail } on API error
 */
export async function loadMetricsFallback(config, begin, end) {
  const fallback = config.metricsApiFallback
  const { metricsDataset, fields } = fallback
  if (!metricsDataset || !fields?.length) return { data: null, loaded: false }

  let query

  if (fallback.directFields) {
    const aliases = fields
      .map(
        (field) => `
  ${field}: ${metricsDataset} (
    limit: 10000
    groupBy: [ts]
    orderBy: [ts_ASC]
    filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end } }
  ) {
    ts
    ${field}
  }`
      )
      .join('')

    query = {
      query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {${aliases}
}`,
      variables: { tsRange_begin: begin, tsRange_end: end }
    }
  } else {
    const returnFields = ['ts', ...fields].join('\n    ')
    query = {
      query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {
  ${metricsDataset} (
    limit: 10000
    groupBy: [ts]
    orderBy: [ts_ASC]
    filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end } }
  ) {
    ${returnFields}
  }
}`,
      variables: { tsRange_begin: begin, tsRange_end: end }
    }
  }

  const response = await graphqlRequest(makeBeholderBaseUrl(), query)

  if (response.statusCode !== 200) {
    throw {
      reason: 'api-error',
      detail: response.body?.detail || 'The server could not load this chart.'
    }
  }

  if (fallback.directFields) {
    const dataByAlias = response.body?.data || {}
    const perTs = new Map()
    for (const field of fields) {
      const rows = Array.isArray(dataByAlias[field]) ? dataByAlias[field] : []
      rows.forEach((row) => {
        if (!row?.ts) return
        if (!perTs.has(row.ts)) perTs.set(row.ts, { ts: row.ts })
        const val = row[field]
        perTs.get(row.ts)[field] = typeof val === 'number' ? val : 0
      })
    }
    return {
      data: Array.from(perTs.values()).sort(
        (rowA, rowB) => new Date(rowA.ts) - new Date(rowB.ts)
      ),
      loaded: true
    }
  }

  const rows = response.body?.data?.[metricsDataset]
  if (!Array.isArray(rows)) {
    return { data: [], loaded: true }
  }
  return {
    data: rows
      .filter((row) => row?.ts)
      .sort((left, right) => new Date(left.ts) - new Date(right.ts)),
    loaded: true
  }
}

/**
 * Build and issue one multi-alias GraphQL query against the Metrics API —
 * one alias per series, each with its own filter. Targets the Metrics endpoint
 * for datasets that only exist in the Metrics API (e.g. botManagerMetrics).
 *
 * Supports two shapes:
 *   - `groupByPivot`: single query with groupBy: [ts, <field>], pivoted client-side
 *   - `series`: explicit named series, each with its own filter
 *
 * @param {Object} config - Chart config with `metricsApiSeries` property
 * @param {string} begin - ISO 8601 begin timestamp
 * @param {string} end - ISO 8601 end timestamp
 * @returns {Promise<Array>} Chart data rows
 * @throws {Object} { reason, detail } on API error
 */
export async function loadMetricsSeries(config, begin, end) {
  const { metricsDataset, series, groupByPivot } = config.metricsApiSeries
  if (!metricsDataset) return []

  if (groupByPivot?.field) {
    // ── groupByPivot path ──
    const agg = groupByPivot.aggregate || 'sum: requests'
    const aggReturnField = agg.split(':')[0].trim()
    const field = groupByPivot.field

    const query = {
      query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {
  ${metricsDataset}(
    limit: 10000
    aggregate: { ${agg} }
    groupBy: [ts, ${field}]
    orderBy: [ts_ASC]
    filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end } }
  ) { ts ${field} ${aggReturnField} }
}`,
      variables: { tsRange_begin: begin, tsRange_end: end }
    }

    const response = await graphqlRequest(makeBeholderBaseUrl(), query)

    if (response.statusCode !== 200) {
      throw {
        reason: 'api-error',
        detail: response.body?.detail || 'The server could not load this chart.'
      }
    }

    const rows = response.body?.data?.[metricsDataset]
    if (!Array.isArray(rows) || !rows.length) return []

    const labelMap = groupByPivot.labelMap || {}
    return pivotGroupedData(
      rows.map((row) => {
        const rawKey = String(row[field] ?? 'unknown')
        const label = labelMap[rawKey] || rawKey
        return { ts: row.ts, _pivotKey: label, [aggReturnField]: row[aggReturnField] ?? 0 }
      }),
      '_pivotKey',
      aggReturnField
    )
  }

  // ── series path ──
  if (!Array.isArray(series) || !series.length) return []

  const aliasToName = new Map()
  const safeAliases = []
  const aliases = series.map((entry, index) => {
    const displayName = entry.name || `series_${index}`
    const safeAlias = `s${index}`
    aliasToName.set(safeAlias, displayName)
    safeAliases.push(safeAlias)
    const filterPairs = ['tsRange: { begin: $tsRange_begin, end: $tsRange_end }']
    Object.entries(entry.filters || {}).forEach(([key, value]) => {
      filterPairs.push(`${key}: ${toGraphQLScalar(value)}`)
    })
    const agg = entry.aggregate || 'sum: requests'
    const aggReturnField = agg.split(':')[0].trim()
    return `  ${safeAlias}: ${metricsDataset}(
    limit: 10000
    aggregate: { ${agg} }
    groupBy: [ts]
    orderBy: [ts_ASC]
    filter: { ${filterPairs.join(', ')} }
  ) { ts ${aggReturnField} }`
  })

  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {\n${aliases.join('\n')}\n}`,
    variables: { tsRange_begin: begin, tsRange_end: end }
  }

  const response = await graphqlRequest(makeBeholderBaseUrl(), query)

  if (response.statusCode !== 200) {
    throw {
      reason: 'api-error',
      detail: response.body?.detail || 'The server could not load this chart.'
    }
  }

  const dataByAlias = response.body?.data || {}
  const perTs = new Map()
  const displayNames = []
  for (const safeAlias of safeAliases) {
    const displayName = aliasToName.get(safeAlias)
    displayNames.push(displayName)
    const rows = Array.isArray(dataByAlias[safeAlias]) ? dataByAlias[safeAlias] : []
    rows.forEach((row) => {
      if (!row?.ts) return
      if (!perTs.has(row.ts)) perTs.set(row.ts, { ts: row.ts })
      const val = row.sum ?? row.count ?? row.avg ?? 0
      perTs.get(row.ts)[displayName] = val
    })
  }
  // Backfill missing series with 0 so chart builder sees a consistent set.
  for (const row of perTs.values()) {
    for (const displayName of displayNames) {
      if (!(displayName in row)) row[displayName] = 0
    }
  }
  return Array.from(perTs.values()).sort(
    (left, right) => new Date(left.ts) - new Date(right.ts)
  )
}

/**
 * Build and issue one multi-alias GraphQL query against the raw Events
 * dataset — one alias per series, each with its own filter. Rows are merged
 * per ts into the pivoted shape the chart builder expects.
 *
 * Supports two shapes:
 *   - `series`: explicit named series, each with its own filter
 *   - `groupByPivot`: single query with groupBy: [ts, <field>], pivoted client-side
 *
 * @param {Object} config - Chart config with `eventsApi` property
 * @param {string} begin - ISO 8601 begin timestamp
 * @param {string} end - ISO 8601 end timestamp
 * @returns {Promise<Array>} Chart data rows
 * @throws {Object} { reason, detail } on API error
 */
export async function loadFromEventsApi(config, begin, end) {
  const { dataset, series, groupByPivot } = config.eventsApi

  let body
  let postProcess
  if (Array.isArray(series) && series.length) {
    const seriesNames = []
    const aliases = series.map((entry, index) => {
      const alias = entry.name || `series_${index}`
      seriesNames.push(alias)
      const filterPairs = ['tsRange: { begin: $tsRange_begin, end: $tsRange_end }']
      Object.entries(entry.filters || {}).forEach(([key, value]) => {
        filterPairs.push(`${key}: ${toGraphQLScalar(value)}`)
      })
      const agg = entry.aggregate || 'count: rows'
      const aggReturnField = agg.startsWith('count') ? 'count' : agg.split(':')[0].trim()
      return `  ${alias}: ${dataset}(
    limit: 10000
    aggregate: { ${agg} }
    groupBy: [ts]
    orderBy: [ts_ASC]
    filter: { ${filterPairs.join(', ')} }
  ) { ts ${aggReturnField} }`
    })
    body = aliases.join('\n')
    postProcess = (dataByAlias) => {
      const perTs = new Map()
      for (const name of seriesNames) {
        const rows = Array.isArray(dataByAlias[name]) ? dataByAlias[name] : []
        rows.forEach((row) => {
          if (!row?.ts) return
          if (!perTs.has(row.ts)) perTs.set(row.ts, { ts: row.ts })
          const val = row.count ?? row.avg ?? row.sum ?? 0
          perTs.get(row.ts)[name] = val
        })
      }
      return Array.from(perTs.values()).sort(
        (left, right) => new Date(left.ts) - new Date(right.ts)
      )
    }
  } else if (groupByPivot?.field) {
    const field = groupByPivot.field
    const filterPairs = ['tsRange: { begin: $tsRange_begin, end: $tsRange_end }']
    Object.entries(groupByPivot.filters || {}).forEach(([key, value]) => {
      filterPairs.push(`${key}: ${toGraphQLScalar(value)}`)
    })
    body = `  ${dataset}(
    limit: 10000
    aggregate: { count: rows }
    groupBy: [ts, ${field}]
    orderBy: [ts_ASC]
    filter: { ${filterPairs.join(', ')} }
  ) { ts ${field} count }`
    postProcess = (dataByAlias) => {
      const rows = Array.isArray(dataByAlias[dataset]) ? dataByAlias[dataset] : []
      return pivotGroupedData(rows, field, 'count', { topN: config.topN })
    }
  } else {
    return []
  }

  const query = {
    query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {\n${body}\n}`,
    variables: { tsRange_begin: begin, tsRange_end: end }
  }

  const response = await graphqlRequest(makeRealTimeEventsBaseUrl(), query)

  if (response.statusCode !== 200) {
    throw {
      reason: 'api-error',
      detail: response.body?.detail || 'The server could not load this chart.'
    }
  }

  let rows = postProcess(response.body?.data || {})

  // Allow configs to supply a custom post-process step (e.g. derive a
  // percentage from two raw series).
  if (typeof config.eventsApiPostProcess === 'function') {
    rows = config.eventsApiPostProcess(rows)
  }

  return rows
}

/**
 * Load chart data using the default Metrics API aggregation path.
 * Handles schema guard (filtering fields against live backend enum),
 * and three response shapes: aggregation, direct, and aliases.
 *
 * @param {Object} config - Chart config with metricsDataset, fields, aggregation, etc.
 * @param {string} begin - ISO 8601 begin timestamp
 * @param {string} end - ISO 8601 end timestamp
 * @param {Object} options
 * @param {Function} options.loadAggregableFields - Async function to load aggregable fields for schema guard
 * @returns {Promise<Array>} Chart data rows
 * @throws {Object} { reason, detail } on API error or schema mismatch
 */
export async function loadMetricsAggregation(config, begin, end, { loadAggregableFields }) {
  // Schema guard: drop any field not present in the live backend enum.
  const aggregableFields = await loadAggregableFields(config.metricsDataset)
  if (aggregableFields.size) {
    if (Array.isArray(config.fields) && config.fields.length) {
      const kept = config.fields.filter((field) => aggregableFields.has(field))
      if (!kept.length) {
        throw {
          reason: 'schema-mismatch',
          detail: `The backend does not expose any of the fields needed to load "${config.label || 'this chart'}".`
        }
      }
      config = { ...config, fields: kept }
    }
    if (config.aggregation && !aggregableFields.has(config.aggregation)) {
      throw {
        reason: 'schema-mismatch',
        detail: `The backend does not expose the field needed to load "${config.label || 'this chart'}".`
      }
    }
  }

  const filterEntries = config.filters || {}
  const extraFilterFragments = Object.entries(filterEntries).map(
    ([key, val]) => `${key}: ${toGraphQLScalar(val)}`
  )
  const filterBlock =
    'filter: { tsRange: { begin: $tsRange_begin, end: $tsRange_end }' +
    (extraFilterFragments.length ? `, ${extraFilterFragments.join(', ')}` : '') +
    ' }'

  const variables = { tsRange_begin: begin, tsRange_end: end }

  let query
  let responseShape

  if (config.aggregation) {
    const groupByFields = config.groupBy || ['ts']
    const groupByStr = groupByFields.join(', ')
    const orderByStr = `${groupByFields[0]}_ASC`
    const returnFields = ['sum', ...groupByFields].join('\n            ')

    query = {
      query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {
  ${config.metricsDataset} (
    limit: 10000
    aggregate: { sum: ${config.aggregation} }
    groupBy: [${groupByStr}]
    orderBy: [${orderByStr}]
    ${filterBlock}
  ) {
    ${returnFields}
  }
}`,
      variables
    }
    responseShape = 'aggregation'
  } else {
    const fields = Array.isArray(config.fields) ? config.fields : []
    if (!fields.length) return []

    if (config.directFields) {
      const aliases = fields
        .map(
          (field) => `
  ${field}: ${config.metricsDataset} (
    limit: 10000
    groupBy: [ts]
    orderBy: [ts_ASC]
    ${filterBlock}
  ) {
    ts
    ${field}
  }`
        )
        .join('')

      query = {
        query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {${aliases}
}`,
        variables
      }
      responseShape = 'direct'
    } else {
      const aliases = fields
        .map(
          (field) => `
  ${field}: ${config.metricsDataset} (
    limit: 10000
    aggregate: { sum: ${field} }
    groupBy: [ts]
    orderBy: [ts_ASC]
    ${filterBlock}
  ) {
    ts
    sum
  }`
        )
        .join('')

      query = {
        query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {${aliases}
}`,
        variables
      }
      responseShape = 'aliases'
    }
  }

  const response = await graphqlRequest(makeBeholderBaseUrl(), query)

  if (response.statusCode !== 200) {
    throw {
      reason: 'api-error',
      detail: response.body?.detail || 'The server could not load this chart.'
    }
  }

  if (responseShape === 'aggregation') {
    const rawData = response.body?.data?.[config.metricsDataset]
    const rows = Array.isArray(rawData) ? rawData : []
    const pivotField = (config.groupBy || ['ts']).find((field) => field !== 'ts')
    if (pivotField && rows.length) {
      return pivotGroupedData(rows, pivotField, 'sum', { topN: config.topN })
    }
    return rows.map((row) => ({
      ts: row.ts,
      [config.aggregation]: row.sum ?? 0
    }))
  }

  if (responseShape === 'direct') {
    const dataByAlias = response.body?.data || {}
    const perTs = new Map()
    for (const field of config.fields) {
      const rows = Array.isArray(dataByAlias[field]) ? dataByAlias[field] : []
      rows.forEach((row) => {
        if (!row?.ts) return
        if (!perTs.has(row.ts)) perTs.set(row.ts, { ts: row.ts })
        const val = row[field]
        perTs.get(row.ts)[field] = typeof val === 'number' ? val : 0
      })
    }
    return Array.from(perTs.values()).sort(
      (rowA, rowB) => new Date(rowA.ts) - new Date(rowB.ts)
    )
  }

  // responseShape === 'aliases'
  const dataByAlias = response.body?.data || {}
  const perTs = new Map()
  for (const field of config.fields) {
    const rows = Array.isArray(dataByAlias[field]) ? dataByAlias[field] : []
    rows.forEach((row) => {
      if (!row?.ts) return
      if (!perTs.has(row.ts)) perTs.set(row.ts, { ts: row.ts })
      perTs.get(row.ts)[field] = row.sum ?? 0
    })
  }
  return Array.from(perTs.values()).sort(
    (left, right) => new Date(left.ts) - new Date(right.ts)
  )
}
