import { ref } from 'vue'
import { loadAggregableFields } from '@/modules/filter-loaders/dataset-fields-loader'
import { resolveChartApi } from '@/services/real-time-events-service/chart-api-router'
import {
  loadMetricsFallback,
  loadMetricsSeries,
  loadFromEventsApi,
  loadMetricsAggregation,
  pivotGroupedData
} from '@/services/real-time-events-service/metrics-chart-service'

export { pivotGroupedData }

export class MetricsChartError extends Error {
  constructor(message, { reason, detail } = {}) {
    super(message)
    this.name = 'MetricsChartError'
    this.reason = reason || 'unknown'
    this.detail = detail || null
  }
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

      // Metrics-only series: datasets that only exist in the Metrics API (e.g. botManagerMetrics).
      // Always routed to the Metrics endpoint regardless of time range.
      if (config.metricsApiSeries?.series?.length || config.metricsApiSeries?.groupByPivot?.field) {
        data.value = await loadMetricsSeries(config, begin, end)
        return
      }

      // Route via the central chart-api-router: ≤ 30 min → Events API, > 30 min → Metrics API.
      if (config.eventsApi?.series?.length || config.eventsApi?.groupByPivot?.field) {
        const api = resolveChartApi(begin, end)
        if (api === 'metrics' && config.metricsApiFallback) {
          const result = await loadMetricsFallback(config, begin, end)
          if (result.loaded) {
            data.value = result.data ?? []
          }
          return
        }
        data.value = await loadFromEventsApi(config, begin, end)
        return
      }

      // Default aggregation path via Metrics API with schema guard.
      data.value = await loadMetricsAggregation(config, begin, end, { loadAggregableFields })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('useMetricsChart: failed to load', err)
      data.value = []
      const typed =
        err instanceof MetricsChartError
          ? err
          : new MetricsChartError(err?.message || err?.detail || 'Chart could not be loaded.', {
              reason: err?.reason || 'unknown',
              detail: err?.detail || err?.message || null
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
      fields: ['savedRequests', 'missedRequests']
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
      fields: ['savedRequests', 'missedRequests']
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
    // For ranges > 30 min fall back to Metrics API using avg aggregation,
    // mirroring how Real-Time Metrics loads this chart.
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      aggregation: 'requestTime',
      aggregationType: 'avg'
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
    // upstreamResponseTime exists in httpMetrics aggregated fields — use avg aggregation
    // mirroring the same pattern as avgRequestTime.
    metricsApiFallback: {
      metricsDataset: 'httpMetrics',
      aggregation: 'upstreamResponseTime',
      aggregationType: 'avg'
    }
  },
  avgConnectTime: {
    chartConfigKey: 'avgConnectTime',
    label: 'Avg Connect Time',
    dashboardId: '357548623571976783',
    eventsApi: {
      dataset: 'workloadEvents',
      series: [{ name: 'upstreamConnectTime', aggregate: 'avg: upstreamConnectTime', filters: {} }]
    }
    // No metricsApiFallback: upstreamConnectTime does not exist in httpMetrics aggregated fields.
    // For ranges > 30 min the Events API is used directly (may return partial data).
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
