import { ref } from 'vue'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeBeholderBaseUrl } from '@/services/real-time-metrics-services/make-beholder-base-url'
import { makeRealTimeEventsBaseUrl } from '@/services/real-time-events-service/make-real-time-events-service'
import { loadAggregableFields } from '@/modules/filter-loaders/dataset-fields-loader'

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
        return `  ${alias}: ${dataset}(
    limit: 10000
    aggregate: { count: rows }
    groupBy: [ts]
    orderBy: [ts_ASC]
    filter: { ${filterPairs.join(', ')} }
  ) { ts count }`
      })
      body = aliases.join('\n')
      postProcess = (dataByAlias) => {
        const perTs = new Map()
        for (const name of seriesNames) {
          const rows = Array.isArray(dataByAlias[name]) ? dataByAlias[name] : []
          rows.forEach((row) => {
            if (!row?.ts) return
            if (!perTs.has(row.ts)) perTs.set(row.ts, { ts: row.ts })
            perTs.get(row.ts)[name] = row.count ?? 0
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

    data.value = postProcess(response.body?.data || {})
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

      // Events API fast path: WAF/Bot timeseries aggregate per-second over
      // the raw Events dataset (workloadEvents / botManagerEvents) instead of
      // Metrics, because the `<Dataset>AggregatedFields` enum in the live
      // schema does not expose the calculated fields these charts need.
      // Two shapes are supported:
      //   • `series`:       explicit aliased sub-queries, one per filter.
      //   • `groupByPivot`: single query with groupBy: [ts, <field>], pivoted
      //                     on the field's value client-side.
      if (config.eventsApi?.series?.length || config.eventsApi?.groupByPivot?.field) {
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
        // Multi-field sum-per-field: one GraphQL alias per field, each with
        // its own `aggregate: { sum: <field> }`, grouped by ts.
        const fields = Array.isArray(config.fields) ? config.fields : []
        if (!fields.length) {
          data.value = []
          return
        }
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
          // Flatten single-series { ts, sum } rows to the column name the
          // chart builder expects (use aggregation variable name as the
          // series label so tooltips/legend read naturally).
          data.value = rows.map((row) => ({
            ts: row.ts,
            [config.aggregation]: row.sum ?? 0
          }))
        }
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
    }
  },
  wafXss: {
    chartConfigKey: 'wafXss',
    label: 'Cross-Site Scripting (XSS)',
    dashboardId: '357548675837198933',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'wafRequestsXssAttacks', filters: { wafAttackFamilyEq: '$XSS' } }]
    }
  },
  wafRfi: {
    chartConfigKey: 'wafRfi',
    label: 'Remote File Inclusion (RFI)',
    dashboardId: '357548675837198933',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'wafRequestsRfiAttacks', filters: { wafAttackFamilyEq: '$RFI' } }]
    }
  },
  wafSql: {
    chartConfigKey: 'wafSql',
    label: 'SQL Injection',
    dashboardId: '357548675837198933',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'wafRequestsSqlAttacks', filters: { wafAttackFamilyEq: '$SQL' } }]
    }
  },
  wafOther: {
    chartConfigKey: 'wafOther',
    label: 'Other Threats',
    dashboardId: '357548675837198933',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'wafRequestsOthersAttacks', filters: { wafAttackFamilyEq: '$OTHERS' } }]
    }
  },
  // `wafThreatsByHost`, `botTraffic`, `botCaptcha` keep the Metrics API
  // path because the `requests` field they aggregate is a basic member of the
  // `<Dataset>AggregatedFields` enum (confirmed by mirroring RT Metrics'
  // `reports.js` queries). Filter values are inlined per
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
  botTraffic: {
    metricsDataset: 'botManagerMetrics',
    aggregation: 'requests',
    groupBy: ['ts', 'classified'],
    chartConfigKey: 'botTraffic',
    label: 'Bot Traffic',
    dashboardId: '371360344901061482'
  },
  botCaptcha: {
    metricsDataset: 'botManagerMetrics',
    aggregation: 'requests',
    groupBy: ['ts', 'challengeSolved'],
    chartConfigKey: 'botCaptcha',
    label: 'Bot CAPTCHA',
    dashboardId: '371360344901061482'
  }
}
