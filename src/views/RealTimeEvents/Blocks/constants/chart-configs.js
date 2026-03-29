/**
 * Chart configurations for Real-Time Events tabs.
 * Note: Events API uses 'ts' for time grouping. Status grouping may not be available.
 */

/**
 * Status code colors using CSS variables from c3.scss
 */
const STATUS_COLORS = {
  '2xx': 'var(--series-two-color)', // Green
  '3xx': 'var(--series-three-color)', // Blue
  '4xx': 'var(--scale-orange)', // Orange
  '5xx': 'var(--series-five-color)' // Red
}

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
    dataset: 'httpEvents',
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
    dataset: 'edgeFunctionsEvents',
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
    dataset: 'cellsConsoleEvents',
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
    dataset: 'imagesProcessedEvents',
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
    dataset: 'l2CacheEvents',
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
    dataset: 'idnsQueriesEvents',
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
  }
}

/**
 * Normalize HTTP status code to range
 */
const normalizeStatusCode = (status) => {
  if (!status) return '2xx'

  const statusStr = String(status)

  if (statusStr.endsWith('xx')) {
    return statusStr
  }

  const firstDigit = statusStr.charAt(0)
  switch (firstDigit) {
    case '2':
      return '2xx'
    case '3':
      return '3xx'
    case '4':
      return '4xx'
    case '5':
      return '5xx'
    default:
      return '2xx'
  }
}

/**
 * Get chart configuration for a tab
 */
const getChartConfig = (tabKey) => {
  return CHART_CONFIGS[tabKey] || null
}

export { CHART_CONFIGS, getChartConfig, normalizeStatusCode, STATUS_COLORS, DEFAULT_COLORS }
