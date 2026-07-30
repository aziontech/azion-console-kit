import { ref, computed, watch } from 'vue'
import { parseView } from './view-protocol'

/**
 * Composable that encapsulates the unified View selector wiring AND owns the
 * single writable View source of truth (design §3.6, task 9.4 — req 4.12).
 *
 * VIEW SINGLE-SOURCE-OF-TRUTH: `selectedView` is the ONLY writable view state.
 * The derived controls — `stackByField`, `selectedMetricsDashboard`,
 * `isMetricsView` — are COMPUTEDS derived from `parseViewValue(selectedView)`;
 * they have no independent writers. Previously `stackByField` was a raw ref in
 * the tab panel and `selectedMetricsDashboard` was a writable ref owned by
 * `useMetricsChart`, both mutated imperatively by `applyViewIntent`. Deriving
 * them off `selectedView` removes that dual ownership: a View change updates
 * one ref and every dependent recomputes deterministically.
 *
 * INTENT-EMITTING (design §3.8/§7.5): on a View change this composable does not
 * reload itself. It EMITS an intent `{scheme, key}` to the single reload seam
 * (`useEventsExplorer.reload('view', { intent })`), which issues exactly one
 * events-list + one chart aggregation. Because the derived controls now flow
 * from `selectedView`, applying the intent is a no-op write-back of the same
 * `selectedView` value (the seam keeps `selectedView` authoritative).
 *
 * @param {Object} [options]
 * @param {(intent: {scheme:'events'|'metrics', key:string}) => void} [options.onIntent] - called on every view change with the parsed intent. The single reload seam interprets it.
 * @returns {{
 *   selectedView: import('vue').Ref<string>,
 *   isMetricsView: import('vue').ComputedRef<boolean>,
 *   stackByField: import('vue').ComputedRef<string>,
 *   selectedMetricsDashboard: import('vue').ComputedRef<string|null>
 * }}
 */
export function useViewSync({ onIntent } = {}) {
  const selectedView = ref('events:none')

  // Single derived parse of the writable source; every control below reads it.
  const parsed = computed(() => parseView(selectedView.value))

  // Chart kind currently showing — used to toggle KPI bar and pick the chart
  // data source in the template.
  const isMetricsView = computed(() => parsed.value.scheme === 'metrics')

  // Events stack-by key — 'none' whenever a metrics view is active.
  const stackByField = computed(() =>
    parsed.value.scheme === 'events' ? parsed.value.key : 'none'
  )

  // Active metrics selection — null whenever an events view is active. Consumed
  // (injected) by useChartConfig/useMetricsChart, which no longer own it.
  const selectedMetricsDashboard = computed(() =>
    parsed.value.scheme === 'metrics' ? parsed.value.key : null
  )

  watch(selectedView, (value) => {
    // Vue's `watch` intentionally does not fire on creation (no `immediate`),
    // so every invocation here corresponds to an actual view change driven by
    // the user (or a programmatic switch such as the metrics-error fallback in
    // tab-panel-block.vue). Emit the intent; the seam owns the reload.
    if (typeof onIntent === 'function') onIntent(parseView(value))
  })

  return { selectedView, isMetricsView, stackByField, selectedMetricsDashboard }
}
