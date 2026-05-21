import { computed, ref, watch } from 'vue'
import { useMetricsChart, METRICS_CHART_CONFIGS } from './useMetricsChart'
import {
  loadAggregableFields,
  getAggregableFields
} from '@/modules/filter-loaders/dataset-fields-loader'

/**
 * Parse a unified `View` selection value. The View dropdown mixes two
 * families of options using a scheme-prefixed encoding so the caller can
 * route loading to the correct service:
 *
 *   events:<stackBy>      – 'events:none' | 'events:status' | 'events:requestMethod'
 *   metrics:<metricsKey>  – 'metrics:wafThreats' | 'metrics:botTraffic' | ...
 *
 * @param {string} viewValue
 * @returns {{ scheme: 'events'|'metrics', key: string }}
 */
export function parseViewValue(viewValue) {
  if (typeof viewValue !== 'string' || !viewValue.includes(':')) {
    return { scheme: 'events', key: 'none' }
  }
  const [scheme, ...rest] = viewValue.split(':')
  const key = rest.join(':')
  if (scheme !== 'events' && scheme !== 'metrics') {
    return { scheme: 'events', key: 'none' }
  }
  return { scheme, key: key || 'none' }
}

/**
 * Composable for chart configuration resolution, metrics dashboard watcher,
 * View selector option groups, and brush-select handling.
 *
 * The View dropdown presents a grouped list (Events + Metrics) to unify what
 * used to be two separate controls (`Stack by` and `Metrics`). Events options
 * come from the active tab config; Metrics options are filtered by the
 * `metricsDashboardIds` declared in the active panel config.
 *
 * @param {Object} options
 * @param {import('vue').Ref<Object>}         options.filterData              – shared reactive filter state
 * @param {import('vue').ComputedRef<Array>}  options.metricsDashboards       – dashboard options from props (used to get allowed dashboard IDs)
 * @param {import('vue').Ref<Object>}         options.filterSystemRef         – template ref to AdvancedFilterSystem
 * @param {Function}                           options.reloadListTableWithHash – triggers filter-hash sync + data reload
 * @param {import('vue').ComputedRef<Array>}  [options.eventsStackOptions]    – tab-level stack options (defaults to Default/Status/Request Method)
 * @param {import('vue').ComputedRef<boolean>}[options.supportsStacking]      – whether the active tab supports stack-by (false for Functions/DNS/etc)
 * @param {import('vue').ComputedRef<string>} [options.accountTimezone]       – IANA timezone of the user account (e.g. 'America/Sao_Paulo')
 */
export function useChartConfig({
  filterData,
  metricsDashboards,
  filterSystemRef,
  reloadListTableWithHash,
  eventsStackOptions = computed(() => []),
  supportsStacking = computed(() => true),
  onMetricsError = null,
  accountTimezone = computed(() => 'UTC')
}) {
  // ── Metrics chart (WAF / dashboard overlay) ──
  const {
    data: metricsChartData,
    isLoading: isLoadingMetricsChart,
    configKey: metricsChartConfigKey,
    selectedDashboard: selectedMetricsDashboard,
    load: loadMetricsChart
  } = useMetricsChart(filterData, {
    onError: onMetricsError
  })

  // Live snapshot of each Metrics dataset's aggregable-fields enum. Starts as
  // `null` (unknown) per dataset; once populated via introspection we filter
  // out chart configs whose fields/aggregation aren't in the backend enum so
  // the user never sees a chart the backend would reject.
  const aggregableFieldsByDataset = ref(new Map())

  const canUseConfig = (cfg) => {
    const set = aggregableFieldsByDataset.value.get(cfg.metricsDataset)
    if (!set || !set.size) return true // unknown → optimistic
    if (Array.isArray(cfg.fields) && cfg.fields.length) {
      return cfg.fields.some((field) => set.has(field))
    }
    if (cfg.aggregation) return set.has(cfg.aggregation)
    return true
  }

  // Metrics entries grouped by their dashboard (WAF, Bot Manager, …). The
  // metricsDashboards prop carries both the allowed IDs (filter) and the
  // user-facing labels used as group headers. Configs that the live schema
  // cannot satisfy are dropped so the dropdown only ever lists working charts.
  const metricsGroupsByDashboard = computed(() => {
    const dashboards = metricsDashboards.value || []
    if (!dashboards.length) return []

    // Touch the ref so the computed re-runs when new enums land.
    // eslint-disable-next-line no-unused-expressions
    aggregableFieldsByDataset.value

    const entries = Object.entries(METRICS_CHART_CONFIGS)
    return dashboards
      .map((dashboard) => {
        const items = entries
          .filter(([, cfg]) => cfg.dashboardId === dashboard.id)
          .filter(([, cfg]) => canUseConfig(cfg))
          .map(([metricsKey, cfg]) => ({
            label: cfg.label,
            value: `metrics:${metricsKey}`,
            metricsKey
          }))
        return {
          id: dashboard.id,
          group: dashboard.label || dashboard.name || dashboard.id,
          items
        }
      })
      .filter((group) => group.items.length > 0)
  })

  // Kick off introspection for every metricsDataset referenced by the current
  // dashboards. Results update `aggregableFieldsByDataset` which the grouped
  // computed above reacts to.
  watch(
    metricsDashboards,
    (dashboards) => {
      if (!dashboards?.length) return
      const needed = new Set(
        Object.values(METRICS_CHART_CONFIGS)
          .filter((cfg) => dashboards.some((dashboard) => dashboard.id === cfg.dashboardId))
          // Only configs that actually hit the Metrics API need the enum.
          .filter((cfg) => cfg.metricsDataset)
          .map((cfg) => cfg.metricsDataset)
      )
      needed.forEach((dataset) => {
        if (aggregableFieldsByDataset.value.has(dataset)) return
        const cached = getAggregableFields(dataset)
        if (cached) {
          const next = new Map(aggregableFieldsByDataset.value)
          next.set(dataset, cached)
          aggregableFieldsByDataset.value = next
          return
        }
        loadAggregableFields(dataset).then((set) => {
          if (!set) return
          const next = new Map(aggregableFieldsByDataset.value)
          next.set(dataset, set)
          aggregableFieldsByDataset.value = next
        })
      })
    },
    { immediate: true }
  )

  const metricsViewItemsFlat = computed(() =>
    metricsGroupsByDashboard.value.flatMap((group) => group.items)
  )
  const hasMetricsDashboards = computed(() => metricsViewItemsFlat.value.length > 0)

  // Events entries sourced from the active tab config.
  //
  // Collapse rule: when the panel also exposes metrics dashboards (e.g. the
  // "Security" session with WAF + Bot Manager attached), hide the stack-by
  // options and keep only `Default` under Events. The full stack list stays
  // visible on the plain Events tab (no dashboards attached). Revert path is
  // trivial — drop the `hasDashboards` check below.
  const eventsViewItems = computed(() => {
    const options = Array.isArray(eventsStackOptions.value) ? eventsStackOptions.value : []
    const hasDashboards = (metricsDashboards.value || []).length > 0
    if (hasDashboards || !supportsStacking.value || options.length === 0) {
      return [{ label: 'Default', value: 'events:none', stackBy: 'none' }]
    }
    return options.map((opt) => ({
      label: opt.label,
      value: `events:${opt.value}`,
      stackBy: opt.value
    }))
  })

  // Grouped option model: "Events" group first, then one group per allowed
  // dashboard (e.g. "WAF", "Bot Manager"). Groups with zero items are
  // omitted so headers never render alone.
  const viewOptions = computed(() => {
    const groups = []
    if (eventsViewItems.value.length) {
      groups.push({ group: 'Events', items: eventsViewItems.value })
    }
    metricsGroupsByDashboard.value.forEach((entry) => {
      groups.push({ group: entry.group, items: entry.items })
    })
    return groups
  })

  const hasMultipleViewOptions = computed(() => {
    const total = eventsViewItems.value.length + metricsViewItemsFlat.value.length
    return total > 1
  })

  // When the user picks a metrics entry via the View selector, load it.
  watch(selectedMetricsDashboard, (configId) => {
    if (!configId) {
      metricsChartConfigKey.value = null
      return
    }
    const config = METRICS_CHART_CONFIGS[configId]
    if (!config) {
      metricsChartConfigKey.value = null
      return
    }
    metricsChartConfigKey.value = config.chartConfigKey
    loadMetricsChart(config)
  })

  // ── Brush select (zoom into time range) ──
  /**
   * Convert a UTC Date to a "fake local" Date whose getHours/getMinutes/…
   * return the wall-clock values in the given IANA timezone. This is needed
   * because InputDateRange formats dates with date.getHours() (browser-local),
   * but the chart axis uses the account timezone.
   */
  const toUserTzDate = (utcDate, tz) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: false
    }).formatToParts(utcDate)

    const get = (type) => {
      const part = parts.find((part) => part.type === type)
      return part ? parseInt(part.value, 10) : 0
    }

    return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  }

  const handleBrushSelect = ({ begin, end }) => {
    if (!filterData.value) return
    const tsBegin = begin instanceof Date ? begin.toISOString() : String(begin)
    const tsEnd = end instanceof Date ? end.toISOString() : String(end)
    filterData.value = {
      ...filterData.value,
      tsRange: { tsRangeBegin: tsBegin, tsRangeEnd: tsEnd, label: '', labelStart: '', labelEnd: '' }
    }
    // Convert UTC dates to user-timezone-local dates so the date range
    // inputs display the same wall-clock time shown on the chart axis.
    const tz = accountTimezone.value || 'UTC'
    const localBegin = toUserTzDate(begin, tz)
    const localEnd = toUserTzDate(end, tz)
    filterSystemRef.value?.syncDateRangeFromExternal?.(localBegin, localEnd, '')
    // Reload metrics chart if active
    if (selectedMetricsDashboard.value) {
      const config = METRICS_CHART_CONFIGS[selectedMetricsDashboard.value]
      if (config) loadMetricsChart(config)
    }
    reloadListTableWithHash()
  }

  return {
    metricsChartData,
    isLoadingMetricsChart,
    metricsChartConfigKey,
    selectedMetricsDashboard,
    hasMetricsDashboards,
    viewOptions,
    hasMultipleViewOptions,
    loadMetricsChart,
    handleBrushSelect
  }
}
