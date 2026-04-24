import { ref } from 'vue'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeBeholderBaseUrl } from '@/services/real-time-metrics-services/make-beholder-base-url'
import { makeRealTimeEventsBaseUrl } from '@/services/real-time-events-service/make-real-time-events-service'
import { loadAggregableFields } from '@/modules/filter-loaders/dataset-fields-loader'
import { resolveChartApi } from '@/services/real-time-events-service/chart-api-router'

export class MetricsChartError extends Error {
  constructor(message, { reason, detail } = {}) {
    super(message)
    this.name = 'MetricsChartError'
    this.reason = reason || 'unknown'
    this.detail = detail || null
  }
}

/**
 * Serialize a filter value as a GraphQL scalar literal. Mirrors the quoting
 * convention used by `FiltersToGraphQLString` in the Real-Time Metrics module
 * (`src/modules/real-time-metrics/filters/filter-to-graphql-string.js`): the
 * Events/Metrics backend rejects typed GraphQL variables for these fields
 * ("used in position expecting type GenericScalar"), so values are inlined
 * as quoted strings / raw numbers.
 */
const toGraphQLScalar = (value) => {
  if (Array.isArray(value)) return `[${value.map(toGraphQLScalar).join(', ')}]`
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value)
  const str = String(value).replace(/"/g, '\\"')
  return `"${str}"`
}

/**
 * Pivot grouped API rows into a format the chart builder understands.
 * Input:  [{ ts, classified: "Bad Bot", requests: 123 }, { ts, classified: "Legit", requests: 456 }]
 * Output: [{ ts, "Bad Bot": 123, "Legit": 456 }]
 */
function pivotGroupedData(rows, pivotField, aggVariable, { topN } = {}) {
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
  // Cap series count — e.g. "Threats by Host" over a wide range can yield
  // dozens of hosts and blow out the legend. Keep the top N by cumulative
  // aggregate; drop the long tail entirely (do not bucket into "Other" — the
  // chart is purely informational here and the tail is typically noise).
  //
  // After trimming we backfill every row with all top-N keys (defaulting to 0)
  // so that `useChartBuilder` sees a consistent series set regardless of which
  // row it samples from. Without this, the first row may be missing a key
  // simply because no event occurred at that bucket, and the legend ends up
  // inconsistent with the actual chart.
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
    // Even without a topN cap, ensure every row has every category key so
    // that stacking/legend derivation is stable across rows.
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
 * Composable for loading multi-series Metrics chart data.
 * Uses the Metrics GraphQL API directly — no ResolveReport overhead.
 *
 * @param {import('vue').Ref<Object>} filterData
 * @param {Object} [options]
 * @param {(err: MetricsChartError, config: Object) => void} [options.onError]
 *   Invoked when a load is rejected (invalid time range, schema mismatch,
 *   network/API error). Callers typically pipe this to a toast.
 */
export function useMetricsChart(filterData, { onError } = {}) {
  const data = ref([])
  const isLoading = ref(false)
  const configKey = ref(null)
  const selectedDashboard = ref(null)

  const emitError = (err, config) => {
    if (typeof onError === 'function') {
      try {
        onError(err, config)
      } catch {
        /* noop */
      }
    }
  }

  /**
   * Load chart data from the Metrics API for WAF/Bot fields that are returned
   * as direct columns (no aggregate clause) — e.g. wafRequestsXssAttacks.
   *
   * The Real-Time Metrics module queries these fields without `aggregate: { sum: ... }`
   * because they are pre-aggregated scalars in the httpMetrics dataset, not members
   * of the HttpMetricsAggregatedFields enum. The query selects them directly in the
   * return fields and the client sums them per bucket.
   *
   * Used as fallback for eventsApi configs when the range exceeds 30 minutes.
   */
  const loadFromMetricsApiFallback = async (config, begin, end) => {
    const fallback = config.metricsApiFallback
    const { metricsDataset, fields } = fallback
    if (!metricsDataset || !fields?.length) return false

    let query

    if (fallback.directFields) {
      // Direct-column path: one alias per field, no aggregate clause.
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
      // Single query with all fields as return columns (legacy WAF path).
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

    const response = await AxiosHttpClientAdapter.request({
      baseURL: '/',
      url: makeBeholderBaseUrl(),
      method: 'POST',
      body: JSON.stringify(query)
    })

    if (response.statusCode !== 200) {
      throw new MetricsChartError(
        response.body?.detail || 'The server could not load this chart.',
        { reason: 'api-error', detail: response.body?.detail || null }
      )
    }

    if (fallback.directFields) {
      // Merge per-field alias responses into one row per ts.
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
      data.value = Array.from(perTs.values()).sort(
        (rowA, rowB) => new Date(rowA.ts) - new Date(rowB.ts)
      )
    } else {
      const rows = response.body?.data?.[metricsDataset]
      if (!Array.isArray(rows)) {
        data.value = []
        return true
      }
      // Rows already have { ts, field1, field2, ... } shape — pass through directly.
      data.value = rows
        .filter((row) => row?.ts)
        .sort((left, right) => new Date(left.ts) - new Date(right.ts))
    }
    return true
  }

  /**
   * Build and issue one multi-alias GraphQL query against the Metrics API —
   * one alias per series, each with its own filter. Identical in spirit to
   * `loadFromEventsApi` with `series`, but targets the Metrics endpoint
   * (`makeBeholderBaseUrl`) instead of the Events endpoint.
   *
   * Used for datasets that only exist in the Metrics API (e.g. botManagerMetrics)
   * where a single groupBy + pivot query produces the senoidal artifact.
   */
  const loadFromMetricsApiSeries = async (config, begin, end) => {
    const { metricsDataset, series, groupByPivot } = config.metricsApiSeries
    if (!metricsDataset) {
      data.value = []
      return
    }

    let query

    if (groupByPivot?.field) {
      // ── groupByPivot path ──
      // Single query with groupBy: [ts, <field>], pivoted client-side.
      // Same approach as Real-Time Metrics (convert-beholder-to-chart.js).
      const agg = groupByPivot.aggregate || 'sum: requests'
      const aggReturnField = agg.split(':')[0].trim()
      const field = groupByPivot.field

      query = {
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

      const response = await AxiosHttpClientAdapter.request({
        baseURL: '/',
        url: makeBeholderBaseUrl(),
        method: 'POST',
        body: JSON.stringify(query)
      })

      if (response.statusCode !== 200) {
        throw new MetricsChartError(
          response.body?.detail || 'The server could not load this chart.',
          { reason: 'api-error', detail: response.body?.detail || null }
        )
      }

      const rows = response.body?.data?.[metricsDataset]
      if (!Array.isArray(rows) || !rows.length) {
        data.value = []
        return
      }

      // Pivot: convert { ts, <field>: "value", sum: N } rows into
      // { ts, label1: N, label2: M } using optional labelMap for renaming.
      const labelMap = groupByPivot.labelMap || {}
      data.value = pivotGroupedData(
        rows.map((row) => {
          const rawKey = String(row[field] ?? 'unknown')
          const label = labelMap[rawKey] || rawKey
          return { ts: row.ts, _pivotKey: label, [aggReturnField]: row[aggReturnField] ?? 0 }
        }),
        '_pivotKey',
        aggReturnField
      )
      return
    }

    // ── series path ──
    // One alias per series, each with its own filter.
    if (!Array.isArray(series) || !series.length) {
      data.value = []
      return
    }

    // GraphQL aliases cannot contain spaces or special chars. Build a safe
    // alias for each series and keep a map back to the display name.
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

    query = {
      query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {\n${aliases.join('\n')}\n}`,
      variables: { tsRange_begin: begin, tsRange_end: end }
    }

    const response = await AxiosHttpClientAdapter.request({
      baseURL: '/',
      url: makeBeholderBaseUrl(),
      method: 'POST',
      body: JSON.stringify(query)
    })

    if (response.statusCode !== 200) {
      throw new MetricsChartError(
        response.body?.detail || 'The server could not load this chart.',
        { reason: 'api-error', detail: response.body?.detail || null }
      )
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
    data.value = Array.from(perTs.values()).sort(
      (left, right) => new Date(left.ts) - new Date(right.ts)
    )
  }

  /**
   * Build and issue one multi-alias GraphQL query against the raw Events
   * dataset — one alias per series, each with its own filter. Rows are merged
   * per ts into the pivoted shape the chart builder expects:
   *   [{ ts, series1: n, series2: n, ... }, ...]
   *
   * This matches the per-second aggregation the Events histogram uses and
   * works around Metrics schemas whose `<Dataset>AggregatedFields` enum does
   * not expose the required calculated fields (e.g. wafRequests*).
   */
  const loadFromEventsApi = async (config, begin, end) => {
    const { dataset, series, groupByPivot } = config.eventsApi

    // Build aliased sub-queries. Two shapes are supported:
    //   • `series`:       explicit named series, each with its own filter.
    //   • `groupByPivot`: single query with groupBy: [ts, <field>], pivoted
    //                     client-side by the field's value.
    // Values are inlined as GraphQL scalar literals to match the convention
    // the backend enforces (see `toGraphQLScalar` above).
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
        // Support custom aggregate per series (e.g. avg: requestTime for latency charts).
        // Default to { count: rows } for backwards compatibility (WAF/Bot charts).
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
            // Pick the aggregate return field value (count, avg, sum, etc.)
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
      data.value = []
      return
    }

    const query = {
      query: `query ($tsRange_begin: DateTime!, $tsRange_end: DateTime!) {\n${body}\n}`,
      variables: { tsRange_begin: begin, tsRange_end: end }
    }

    const response = await AxiosHttpClientAdapter.request({
      baseURL: '/',
      url: makeRealTimeEventsBaseUrl(),
      method: 'POST',
      body: JSON.stringify(query)
    })

    if (response.statusCode !== 200) {
      throw new MetricsChartError(
        response.body?.detail || 'The server could not load this chart.',
        { reason: 'api-error', detail: response.body?.detail || null }
      )
    }

    let rows = postProcess(response.body?.data || {})

    // Allow configs to supply a custom post-process step (e.g. derive a
    // percentage from two raw series).  The function receives the merged
    // rows and must return the final array.
    if (typeof config.eventsApiPostProcess === 'function') {
      rows = config.eventsApiPostProcess(rows)
    }

    data.value = rows
  }

  /**
   * Load chart data for a given metrics config.
   * @param {Object} config - { metricsDataset, fields, groupBy?, aggregation?, filters?, label?, eventsApi? }
   */
  const load = async (config) => {
    if (!config || !filterData.value?.tsRange) {
      data.value = []
      return
    }

    isLoading.value = true
    try {
      const tsRange = filterData.value.tsRange
      const begin =
        tsRange.tsRangeBegin instanceof Date
          ? tsRange.tsRangeBegin.toISOString()
          : String(tsRange.tsRangeBegin)
      const end =
        tsRange.tsRangeEnd instanceof Date
          ? tsRange.tsRangeEnd.toISOString()
          : String(tsRange.tsRangeEnd)

      // Route via the central chart-api-router: ≤ 30 min → Events API, > 30 min → Metrics API.
      // Configs with `eventsApi` use Events API for short ranges; for longer ranges they fall back
      // to Metrics API via `metricsApiFallback` if defined. If no fallback exists, Events API is
      // always used (no Metrics equivalent available — caller should add metricsApiFallback).

      // Metrics-only series: datasets that only exist in the Metrics API (e.g. botManagerMetrics).
      // Always routed to the Metrics endpoint regardless of time range.
      if (config.metricsApiSeries?.series?.length || config.metricsApiSeries?.groupByPivot?.field) {
        await loadFromMetricsApiSeries(config, begin, end)
        return
      }

      if (config.eventsApi?.series?.length || config.eventsApi?.groupByPivot?.field) {
        const api = resolveChartApi(begin, end)
        if (api === 'metrics' && config.metricsApiFallback) {
          await loadFromMetricsApiFallback(config, begin, end)
          return
        }
        await loadFromEventsApi(config, begin, end)
        return
      }
      // Schema guard: drop any field not present in the live backend enum.
      // Prevents the 400 "Expected type <Dataset>AggregatedFields, found <X>"
      // response when docs and schema disagree (e.g. wafRequestsAllowed).
      const aggregableFields = await loadAggregableFields(config.metricsDataset)
      if (aggregableFields.size) {
        if (Array.isArray(config.fields) && config.fields.length) {
          const kept = config.fields.filter((field) => aggregableFields.has(field))
          if (!kept.length) {
            data.value = []
            throw new MetricsChartError(
              `The backend does not expose any of the fields needed to load "${config.label || 'this chart'}".`,
              { reason: 'schema-mismatch' }
            )
          }
          config = { ...config, fields: kept }
        }
        if (config.aggregation && !aggregableFields.has(config.aggregation)) {
          data.value = []
          throw new MetricsChartError(
            `The backend does not expose the field needed to load "${config.label || 'this chart'}".`,
            { reason: 'schema-mismatch' }
          )
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
        // Single query, single aggregation, optional additional groupBy column.
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
        // Multi-field query: two shapes depending on whether the fields are
        // members of the AggregatedFields enum (use aggregate: { sum: <field> })
        // or pre-calculated scalars returned as direct columns (no aggregate).
        // Pre-calculated fields (e.g. savedRequests, bandwidthSavedData) use
        // `directFields: true` in the config to select the direct-column path.
        const fields = Array.isArray(config.fields) ? config.fields : []
        if (!fields.length) {
          data.value = []
          return
        }

        if (config.directFields) {
          // Direct-column path: fields are pre-calculated scalars returned as
          // direct columns (not members of AggregatedFields enum). Use one alias
          // per field so each gets its own groupBy: [ts] query, then merge by ts.
          // This matches how Real-Time Metrics queries savedRequests, missedRequests, etc.
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
          // Aggregated path: one alias per field with aggregate: { sum: <field> }.
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

      const response = await AxiosHttpClientAdapter.request({
        baseURL: '/',
        url: makeBeholderBaseUrl(),
        method: 'POST',
        body: JSON.stringify(query)
      })

      if (response.statusCode !== 200) {
        throw new MetricsChartError(
          response.body?.detail || 'The server could not load this chart.',
          { reason: 'api-error', detail: response.body?.detail || null }
        )
      }

      if (responseShape === 'aggregation') {
        const rawData = response.body?.data?.[config.metricsDataset]
        const rows = Array.isArray(rawData) ? rawData : []
        const pivotField = (config.groupBy || ['ts']).find((field) => field !== 'ts')
        if (pivotField && rows.length) {
          data.value = pivotGroupedData(rows, pivotField, 'sum', { topN: config.topN })
        } else {
          data.value = rows.map((row) => ({
            ts: row.ts,
            [config.aggregation]: row.sum ?? 0
          }))
        }
      } else if (responseShape === 'direct') {
        // Direct-column aliases: merge per-field alias responses into one row per ts.
        // Each alias returns { ts, <fieldName> } rows — merge them by ts key.
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
        data.value = Array.from(perTs.values()).sort(
          (rowA, rowB) => new Date(rowA.ts) - new Date(rowB.ts)
        )
      } else {
        // Merge per-field aliases into one row per ts.
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
        data.value = Array.from(perTs.values()).sort(
          (left, right) => new Date(left.ts) - new Date(right.ts)
        )
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('useMetricsChart: failed to load', err)
      data.value = []
      const typed =
        err instanceof MetricsChartError
          ? err
          : new MetricsChartError(err?.message || 'Chart could not be loaded.', {
              reason: 'unknown',
              detail: err?.message || null
            })
      emitError(typed, config)
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, configKey, selectedDashboard, load }
}

/**
 * Predefined metrics chart configs for investigation panels.
 * Each entry maps to a GraphQL query and a chart-configs.js visual config.
 *
 * - `fields`: explicit field names returned by the API (simple sum per ts).
 * - `aggregation`: single aggregation variable name (used with groupBy queries).
 * - `groupBy`: GraphQL groupBy clause (defaults to ['ts'] if omitted).
 * - `filters`: extra GraphQL filter fields (e.g. wafBlock: "1").
 */
export const METRICS_CHART_CONFIGS = {
  // ── WAF (dashboard 357548675837198933) ──
  //
  // All WAF charts aggregate per-second over raw `workloadEvents` rather than
  // the Metrics API, because the live `HttpMetricsAggregatedFields` enum does
  // not expose the calculated `wafRequests*` fields documented at
  // https://www.azion.com/en/documentation/devtools/graphql-api/features/gql-real-time-metrics-fields/.
  // Filter keys use the Events `*Eq` operator convention (see
  // `src/helpers/real-time-filters-rules.js`). Series names match the
  // `seriesOrder`/`seriesLabels` in `chart-configs.js` so the chart builder
  // renders them with the intended colors/labels.
  wafThreats: {
    chartConfigKey: 'wafThreats',
    label: 'Threats vs Requests',
    dashboardId: '357548675837198933',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [
        // Allowed: request crossed the WAF without being blocked and outside
        // learning mode (i.e. no threat would have been blocked either).
        { name: 'wafRequestsAllowed', filters: { wafBlockEq: '0', wafLearningEq: '0' } },
        // Threat: WAF identified a threat but was in learning mode so it
        // didn't block (wafLearning=1 implies wafBlock=0 by definition).
        { name: 'wafRequestsThreat', filters: { wafLearningEq: '1' } },
        // Blocked: WAF actually blocked the request.
        { name: 'wafRequestsBlocked', filters: { wafBlockEq: '1' } }
      ]
    },
    // For ranges > 30 min, fall back to Metrics API (httpMetrics exposes these fields).
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      fields: ['wafRequestsAllowed', 'wafRequestsThreat', 'wafRequestsBlocked']
    }
  },
  wafXss: {
    chartConfigKey: 'wafXss',
    label: 'Cross-Site Scripting (XSS)',
    dashboardId: '357548675837198933',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'wafRequestsXssAttacks', filters: { wafAttackFamilyEq: '$XSS' } }]
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      fields: ['wafRequestsXssAttacks']
    }
  },
  wafRfi: {
    chartConfigKey: 'wafRfi',
    label: 'Remote File Inclusion (RFI)',
    dashboardId: '357548675837198933',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'wafRequestsRfiAttacks', filters: { wafAttackFamilyEq: '$RFI' } }]
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      fields: ['wafRequestsRfiAttacks']
    }
  },
  wafSql: {
    chartConfigKey: 'wafSql',
    label: 'SQL Injection',
    dashboardId: '357548675837198933',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'wafRequestsSqlAttacks', filters: { wafAttackFamilyEq: '$SQL' } }]
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      fields: ['wafRequestsSqlAttacks']
    }
  },
  wafOther: {
    chartConfigKey: 'wafOther',
    label: 'Other Threats',
    dashboardId: '357548675837198933',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'wafRequestsOthersAttacks', filters: { wafAttackFamilyEq: '$OTHERS' } }]
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      fields: ['wafRequestsOthersAttacks']
    }
  },
  // `wafThreatsByHost` keeps the Metrics API path because the `requests`
  // field it aggregates is a basic member of the `<Dataset>AggregatedFields`
  // enum (confirmed by mirroring RT Metrics' `reports.js` queries). Filter
  // values are inlined per
  // `src/modules/real-time-metrics/filters/filter-to-graphql-string.js`.
  wafThreatsByHost: {
    metricsDataset: 'httpMetrics',
    aggregation: 'requests',
    groupBy: ['ts', 'host'],
    filters: { wafBlock: '1', wafLearning: '0' },
    // Limit to the top-5 hosts by total threats — wide ranges can otherwise
    // return dozens of hosts and overwhelm the legend.
    topN: 5,
    chartConfigKey: 'wafThreatsByHost',
    label: 'Threats by Host',
    dashboardId: '357548675837198933'
  },
  // ── Bot Manager (dashboard 371360344901061482) ──
  // Bot Manager only has Metrics API (no Events dataset). One alias per
  // category with its own filter — avoids groupBy + pivot senoidal artifact.
  // Filter keys use the Metrics API operator convention (e.g. classifiedEq).
  botTraffic: {
    chartConfigKey: 'botTraffic',
    label: 'Bot Traffic',
    dashboardId: '371360344901061482',
    metricsApiSeries: {
      metricsDataset: 'botManagerMetrics',
      series: [
        { name: 'bad bot', aggregate: 'sum: requests', filters: { classifiedEq: 'bad bot' } },
        { name: 'good bot', aggregate: 'sum: requests', filters: { classifiedEq: 'good bot' } },
        {
          name: 'legitimate',
          aggregate: 'sum: requests',
          filters: { classifiedEq: 'legitimate' }
        },
        {
          name: 'under evaluation',
          aggregate: 'sum: requests',
          filters: { classifiedEq: 'under evaluation' }
        }
      ]
    }
  },
  botCaptcha: {
    chartConfigKey: 'botCaptcha',
    label: 'Bot CAPTCHA',
    dashboardId: '371360344901061482',
    metricsApiSeries: {
      metricsDataset: 'botManagerMetrics',
      groupByPivot: {
        field: 'challengeSolved',
        aggregate: 'sum: requests',
        labelMap: {
          true: 'Resolved',
          false: 'Unresolved',
          1: 'Resolved',
          0: 'Unresolved'
        }
      }
    }
  },

  // ── Performance (dashboard IDs: Data Transferred, Requests, Bandwidth Saving, Tiered Cache) ──

  // 2.1 Cache Behavior
  cacheHitMiss: {
    chartConfigKey: 'cacheHitMiss',
    label: 'Cache Hit vs Miss',
    dashboardId: '357548608166298191',
    eventsApi: {
      dataset: 'workloadEvents',
      groupByPivot: { field: 'upstreamCacheStatus' }
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      fields: ['requestsOffloaded', 'requestsMissed']
    }
  },
  tieredCacheHitMiss: {
    chartConfigKey: 'tieredCacheHitMiss',
    label: 'Tiered Cache Hit vs Miss',
    dashboardId: '357549371218199219',
    eventsApi: {
      dataset: 'tieredCacheEvents',
      groupByPivot: { field: 'upstreamCacheStatus' }
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      fields: ['requestsOffloaded', 'requestsMissed']
    }
  },
  cacheHitRate: {
    chartConfigKey: 'cacheHitRate',
    label: 'Cache Hit Rate',
    dashboardId: '357549179454620239',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [
        {
          name: '_savedCount',
          filters: {
            upstreamCacheStatusIn: ['HIT', 'STALE', 'EXPIRED', 'REVALIDATED']
          }
        },
        {
          name: '_totalCount',
          filters: {}
        }
      ]
    },
    // Derive requestsOffloaded (percentage) from the two raw count series.
    eventsApiPostProcess(rows) {
      return rows.map((row) => {
        const saved = row._savedCount || 0
        const total = row._totalCount || 0
        return {
          ts: row.ts,
          requestsOffloaded: total > 0 ? (saved / total) * 100 : 0
        }
      })
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      directFields: true,
      fields: ['requestsOffloaded']
    }
  },

  // 2.2 Latency
  avgRequestTime: {
    chartConfigKey: 'avgRequestTime',
    label: 'Avg Request Time',
    dashboardId: '357548623571976783',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'requestTime', aggregate: 'avg: requestTime', filters: {} }]
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      directFields: true,
      fields: ['requestTime']
    }
  },
  avgUpstreamResponseTime: {
    chartConfigKey: 'avgUpstreamResponseTime',
    label: 'Avg Upstream Response Time',
    dashboardId: '357548623571976783',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [
        { name: 'upstreamResponseTime', aggregate: 'avg: upstreamResponseTime', filters: {} }
      ]
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      directFields: true,
      fields: ['upstreamResponseTime']
    }
  },
  avgConnectTime: {
    chartConfigKey: 'avgConnectTime',
    label: 'Avg Connect Time',
    dashboardId: '357548623571976783',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'upstreamConnectTime', aggregate: 'avg: upstreamConnectTime', filters: {} }]
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      directFields: true,
      fields: ['upstreamConnectTime']
    }
  },

  // 2.3 Throughput
  bandwidthSavedMissed: {
    chartConfigKey: 'bandwidthSavedMissed',
    label: 'Bandwidth Saved vs Missed',
    dashboardId: '357549179454620239',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [
        {
          name: 'bandwidthSavedData',
          aggregate: 'sum: bytesSent',
          filters: {
            upstreamCacheStatusIn: ['HIT', 'STALE', 'EXPIRED', 'REVALIDATED']
          }
        },
        {
          name: 'bandwidthMissedData',
          aggregate: 'sum: bytesSent',
          filters: {
            upstreamCacheStatusIn: ['MISS', 'BYPASS', 'UPDATING', '-', '']
          }
        }
      ]
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      directFields: true,
      fields: ['bandwidthSavedData', 'bandwidthMissedData']
    }
  },
  requestsSavedMissed: {
    chartConfigKey: 'requestsSavedMissed',
    label: 'Requests Saved vs Missed',
    dashboardId: '357548608166298191',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [
        {
          name: 'savedRequests',
          filters: {
            upstreamCacheStatusIn: ['HIT', 'STALE', 'EXPIRED', 'REVALIDATED']
          }
        },
        {
          name: 'missedRequests',
          filters: {
            upstreamCacheStatusIn: ['MISS', 'BYPASS', 'UPDATING', '-', '']
          }
        }
      ]
    },
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      directFields: true,
      fields: ['savedRequests', 'missedRequests']
    }
  }
}
