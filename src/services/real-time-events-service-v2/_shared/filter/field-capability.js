/**
 * Single source of truth for "is field X filterable on target Y?".
 *
 * Two distinct concerns live elsewhere and must NOT be merged here:
 *   - filterable-fields (this module) — which filter keys a target accepts.
 *   - aggregable-fields (`aggregableFieldsByDataset`/`canUseConfig` in
 *     `useChartConfig`) — whether a chart is viable for a dataset. Left intact.
 *
 * Conservative default: a field not registered for a Metrics dataset is treated
 * as NOT supported, so we never send a key the Metrics API would reject.
 */

/**
 * Fields accepted as filter arguments by each Metrics dataset.
 * Source: https://www.azion.com/en/documentation/devtools/graphql-api/features/gql-real-time-metrics-fields/
 *
 * Fields NOT in this set (e.g. httpUserAgent, requestUri, remoteAddress) are
 * stripped before building the Metrics query. The chart renders with the
 * supported filters; the partial flag tells the UI not to treat the chart total
 * as authoritative.
 */
export const METRICS_FILTER_FIELDS = {
  httpMetrics: new Set([
    'bytesSent',
    'configurationId',
    'geolocCountryName',
    'geolocRegionName',
    'host',
    'proxyStatus',
    'remoteAddressClass',
    'requestLength',
    'requestMethod',
    'requestTime',
    'requests',
    'scheme',
    'sentHttpXOriginalImageSize',
    'serverProtocol',
    'sourceLocPop',
    'sslProtocol',
    'status',
    'upstreamBytesReceived',
    'upstreamCacheStatus',
    'upstreamResponseTime',
    'upstreamStatus',
    'wafAttackFamily',
    'wafBlock',
    'wafLearning'
  ]),
  edgeFunctionsMetrics: new Set([
    'computeTime',
    'configurationId',
    'edgeFunctionId',
    'edgeFunctionInstanceId',
    'edgeFunctionsInstanceIdList',
    'functionLanguage',
    'initiatorType',
    'invocations',
    'sourceLocPop'
  ]),
  imagesProcessedMetrics: new Set([
    'bytesSent',
    'configurationId',
    'host',
    'remoteAddressClass',
    'requestMethod',
    'requestTime',
    'requests',
    'scheme',
    'sourceLocPop',
    'status',
    'upstreamCacheStatus',
    'upstreamResponseTime',
    'upstreamStatus'
  ]),
  l2CacheMetrics: new Set([
    'bytesSent',
    'configurationId',
    'host',
    'proxyStatus',
    'remoteAddressClass',
    'requestLength',
    'requestMethod',
    'requestTime',
    'requests',
    'scheme',
    'sourceLocPop',
    'status',
    'upstreamBytesReceived',
    'upstreamCacheStatus',
    'upstreamResponseTime',
    'upstreamStatus'
  ]),
  idnsQueriesMetrics: new Set(['qtype', 'requests', 'sourceLocPop', 'zoneId']),
  dataStreamedMetrics: new Set([
    'configurationId',
    'dataStreamed',
    'endpointType',
    'requests',
    'sourceLocPop',
    'streamedLines'
  ])
}

/**
 * Strip a trailing filter operator suffix from a filter key, yielding the base
 * field name (e.g. `statusGte` → `status`, `hostIn` → `host`).
 *
 * @param {string} filterKey
 * @returns {string}
 */
export function extractBaseField(filterKey) {
  return String(filterKey).replace(/(Eq|Ne|Like|Ilike|Gte|Gt|Lte|Lt|In|Range|Contains)$/, '')
}

/**
 * Whether a filter key is supported by the given target.
 *
 * @param {string} valueField - filter key (may carry an operator suffix).
 * @param {{ api: 'events' } | { api: 'metrics', dataset?: string }} target
 * @returns {boolean}
 *   For `events`: always true (the Events API accepts every filterable field).
 *   For `metrics`: true only when the base field is registered for that dataset.
 *   Conservative default — unknown/unregistered dataset ⇒ not supported.
 */
export function isFieldSupported(valueField, target) {
  if (!target || target.api === 'events') return true
  if (target.api === 'metrics') {
    const allowed = METRICS_FILTER_FIELDS[target.dataset]
    // Guard against prototype-chain collisions (a dataset named e.g. 'toString'
    // resolves METRICS_FILTER_FIELDS['toString'] to Object.prototype.toString —
    // truthy but has no `.has`) and any non-Set entry. Conservative default:
    // anything that is not a registered Set ⇒ not supported.
    if (!(allowed instanceof Set)) return false
    return allowed.has(extractBaseField(valueField))
  }
  return false
}

/**
 * Resolve the capability target (Metrics dataset) from a `METRICS_CHART_CONFIGS`
 * entry, mirroring the branch order of the metrics `load()`:
 *   1. `metricsApiSeries.metricsDataset` — Metrics-only series.
 *   2. `eventsApi` present ⇒ `metricsApiFallback.metricsDataset` — events routed
 *      via metrics on wide ranges.
 *   3. `config.metricsDataset` — default aggregation path.
 *
 * @param {Object} config
 * @returns {{ api: 'metrics', dataset: string | undefined }}
 */
export function resolveCapabilityTarget(config) {
  const dataset =
    config?.metricsApiSeries?.metricsDataset ||
    (config?.eventsApi ? config?.metricsApiFallback?.metricsDataset : undefined) ||
    config?.metricsDataset
  return { api: 'metrics', dataset }
}
