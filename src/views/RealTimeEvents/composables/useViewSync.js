import { ref, computed, watch } from 'vue'
import { parseViewValue } from './useChartConfig'

/**
 * Composable that encapsulates the unified View selector wiring.
 *
 * Syncs `selectedView` → internal state (`stackByField` for the Events loader,
 * `selectedMetricsDashboard` for the Metrics loader). Single source of truth
 * that replaces the two legacy controls (Stack by + Metrics top dropdown).
 *
 * @param {Object} options
 * @param {import('vue').Ref<string|null>} options.selectedMetricsDashboard
 * @param {import('vue').Ref<string>} options.stackByField
 * @param {() => void} options.reloadListTableWithHash
 * @returns {{ selectedView: import('vue').Ref<string>, isMetricsView: import('vue').ComputedRef<boolean> }}
 */
export function useViewSync({ selectedMetricsDashboard, stackByField, reloadListTableWithHash }) {
  const selectedView = ref('events:none')

  watch(selectedView, (value) => {
    const { scheme, key } = parseViewValue(value)
    if (scheme === 'events') {
      if (selectedMetricsDashboard.value) selectedMetricsDashboard.value = null
      stackByField.value = key || 'none'
    } else {
      stackByField.value = 'none'
      selectedMetricsDashboard.value = key
    }
    // Re-fetch the events list so the documents table reflects the active
    // view (stack-by change or metrics chart selection). Keeps the left-side
    // counter and the table in sync with what the chart is showing.
    reloadListTableWithHash()
  })

  // Chart kind currently showing — used to toggle KPI bar and pick the chart
  // data source in the template.
  const isMetricsView = computed(() => parseViewValue(selectedView.value).scheme === 'metrics')

  return { selectedView, isMetricsView }
}
