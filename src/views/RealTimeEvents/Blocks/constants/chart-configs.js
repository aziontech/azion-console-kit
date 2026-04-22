/**
 * Chart configurations for Real-Time Events tabs.
 * Note: Events API uses 'ts' for time grouping. Status grouping may not be available.
 */

/**
 * Default color palette
 */
const DEFAULT_COLORS = [
  'var(--series-one-color)',
  'var(--series-two-color)',
  'var(--series-three-color)',
  'var(--series-four-color)',
  'var(--series-five-color)',
  'var(--series-six-color)',
  'var(--series-seven-color)',
  'var(--series-eight-color)'
]

/**
 * Chart configurations per event type.
 * Using simple time-series grouping (ts only) for Events API.
 */
const CHART_CONFIGS = {
  httpRequests: {
    dataset: 'workloadEvents',
    aggregation: { count: 'rows' },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: DEFAULT_COLORS
  },

  edgeFunctions: {
    dataset: 'functionEvents',
    aggregation: { count: 'rows' },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: DEFAULT_COLORS
  },

  edgeFunctionsConsole: {
    dataset: 'functionConsoleEvents',
    aggregation: { count: 'rows' },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: DEFAULT_COLORS
  },

  imageProcessor: {
    dataset: 'imageProcessedEvents',
    aggregation: { count: 'rows' },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: DEFAULT_COLORS
  },

  tieredCache: {
    dataset: 'tieredCacheEvents',
    aggregation: { count: 'rows' },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: DEFAULT_COLORS
  },

  edgeDNS: {
    dataset: 'edgeDnsQueriesEvents',
    aggregation: { count: 'rows' },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: DEFAULT_COLORS
  },

  dataStream: {
    dataset: 'dataStreamedEvents',
    aggregation: { count: 'rows' },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: DEFAULT_COLORS
  },

  activityHistory: {
    dataset: 'activityHistoryEvents',
    aggregation: { count: 'rows' },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: DEFAULT_COLORS
  },

  // ── WAF metrics charts ──
  wafThreats: {
    dataset: 'httpMetrics',
    aggregation: { sum: ['wafRequestsAllowed', 'wafRequestsThreat', 'wafRequestsBlocked'] },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'area-spline',
    splineInterpolation: 'monotone',
    areaOpacity: 0.15,
    dataUnit: 'count',
    xAxis: 'ts',
    seriesOrder: ['wafRequestsAllowed', 'wafRequestsThreat', 'wafRequestsBlocked'],
    seriesLabels: {
      wafRequestsAllowed: 'Allowed',
      wafRequestsThreat: 'Threats',
      wafRequestsBlocked: 'Blocked'
    },
    seriesColors: {
      wafRequestsAllowed: '#22c55e',
      wafRequestsThreat: '#eab308',
      wafRequestsBlocked: '#ef4444'
    },
    colors: ['#22c55e', '#eab308', '#ef4444']
  },

  wafXss: {
    dataset: 'httpMetrics',
    aggregation: { sum: ['wafRequestsXssAttacks'] },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: ['#ef4444']
  },

  wafRfi: {
    dataset: 'httpMetrics',
    aggregation: { sum: ['wafRequestsRfiAttacks'] },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: ['#ef4444']
  },

  wafSql: {
    dataset: 'httpMetrics',
    aggregation: { sum: ['wafRequestsSqlAttacks'] },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: ['#ef4444']
  },

  wafOther: {
    dataset: 'httpMetrics',
    aggregation: { sum: ['wafRequestsOthersAttacks'] },
    groupBy: ['ts'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: ['#ef4444']
  },

  wafThreatsByHost: {
    dataset: 'httpMetrics',
    aggregation: { sum: ['requests'] },
    groupBy: ['ts', 'host'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: DEFAULT_COLORS
  },

  // ── Bot Manager metrics charts ──
  botTraffic: {
    dataset: 'botManagerMetrics',
    aggregation: { sum: ['requests'] },
    groupBy: ['ts', 'classified'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    // Backend `classified` values are lowercase (confirmed by the Real-Time
    // Metrics reports at src/modules/real-time-metrics/constants/reports.js):
    // 'bad bot', 'good bot', 'legitimate', 'under evaluation'. Keeping the
    // casing aligned prevents `useChartBuilder` from filtering seriesOrder
    // down to an empty set and rendering a blank chart.
    seriesOrder: ['bad bot', 'good bot', 'legitimate', 'under evaluation'],
    seriesColors: {
      'bad bot': '#ef4444',
      'good bot': '#eab308',
      legitimate: '#22c55e',
      'under evaluation': '#6b7280'
    },
    colors: ['#ef4444', '#eab308', '#22c55e', '#6b7280']
  },

  botCaptcha: {
    dataset: 'botManagerMetrics',
    aggregation: { sum: ['requests'] },
    groupBy: ['ts', 'challengeSolved'],
    limit: 10000,
    orderBy: 'ts_ASC',
    chartType: 'bar',
    dataUnit: 'count',
    xAxis: 'ts',
    colors: DEFAULT_COLORS
  }
}

/**
 * Get chart configuration for a tab
 */
const getChartConfig = (tabKey) => {
  return CHART_CONFIGS[tabKey] || null
}

export { CHART_CONFIGS, getChartConfig, DEFAULT_COLORS }
