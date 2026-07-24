import { parseView, encodeView } from './view-protocol'

/**
 * @typedef {'mount'|'activate'|'view'|'filter'|'range'|'brush'|'page-size'|'query-history'|'saved-search'|'prune'} ReloadReason
 */

/**
 * The set of reasons the single reload seam understands. Kept as an exported
 * frozen list so tests (and future writers) reference the same enumeration
 * instead of hard-coding strings. Each reason maps deterministically to the
 * minimal fetch set below (design §2.1(6), §3.8, §7.5).
 */
export const RELOAD_REASONS = Object.freeze([
  'mount',
  'activate',
  'view',
  'filter',
  'range',
  'brush',
  'page-size',
  'query-history',
  'saved-search',
  'prune'
])

/**
 * `useEventsExplorer` — THE single reload orchestration seam (design §3.8).
 *
 * Historically every user action reached the events-list / chart-agg / metrics
 * loaders through a different writer (watch(stackByField), watch(filterData),
 * useViewSync.reloadListTableWithHash, onActivated loadData, …). Those writers
 * overlapped and produced the classic RTE double-fires: a single events-view
 * change fired the chart aggregation TWICE (the load()-cofire + a redundant
 * watch(stackByField)), a page-size change re-ran the chart aggregation even
 * though the chart is independent of page size, and the events chart aggregation
 * ran under a metrics view where its result is never displayed.
 *
 * This composable funnels ALL of them through one `reload(reason, intent?)`
 * entry. Each reason resolves to the minimal, non-duplicated set of fetches:
 *
 *   | reason         | events-list | events chart-agg        | metrics            |
 *   |----------------|-------------|-------------------------|--------------------|
 *   | mount          | ✔ (hash)    | ✔ (co-fired, if events) | initial via view   |
 *   | activate       | ✔ (in-mem)  | ✔ (co-fired, if events) | reloadActiveMetrics|
 *   | view→events    | ✔ (hash)    | ✔ ONCE (co-fired)       | —                  |
 *   | view→metrics   | ✔ (hash)    | — (suppressed)          | via selection watch|
 *   | filter         | ✔ (hash)    | ✔ (co-fired, if events) | via filterData watch|
 *   | range          | ✔ (hash)    | ✔ (co-fired, if events) | via filterData watch|
 *   | brush          | ✔ (hash)    | ✔ (co-fired, if events) | via filterData watch|
 *   | page-size      | ✔ (in-mem)  | — (suppressed)          | —                  |
 *   | query-history  | ✔ (hash)    | ✔ (co-fired, if events) | via filterData watch|
 *   | saved-search   | ✔ (hash)    | ✔ (co-fired, if events) | via filterData watch|
 *   | prune          | ✔ (hash)    | ✔ (co-fired, if events) | via filterData watch|
 *
 * Invariant guaranteed per reason: ≤1 events-list fetch AND ≤1 metrics fetch;
 * the events chart aggregation runs exactly once when it runs at all (never the
 * historical 2×). Metrics stays on its existing debounce + supersession-token
 * discipline (useMetricsChart) — this seam never issues a synchronous second
 * metrics call, so the ≤1 metrics budget is preserved without touching timing.
 *
 * Dependencies are injected (DIP) so the seam is unit-testable without mounting
 * the 850-line tab panel:
 *
 * The events chart-agg co-fire is suppressed under a metrics view through the
 * reactive `suppressChartAgg` gate wired into useEventsData (a computed of
 * isMetricsView in the tab panel); this seam additionally suppresses it for the
 * page-size reason by passing `{ skipChart: true }` to loadData — the chart is
 * independent of page size.
 *
 * Dependencies are injected (DIP) so the seam is unit-testable without mounting
 * the 850-line tab panel:
 *
 * @param {Object} deps
 * @param {() => void} deps.reloadListTableWithHash - hash-write + events-list load (active-tab aware wrapper). Co-fires the chart aggregation.
 * @param {(opts?: {skipChart?: boolean}) => void} deps.loadData - raw events-list load (no hash write). Used by in-memory reasons (activate/page-size); `skipChart` suppresses the co-fired chart aggregation.
 * @param {() => void} deps.reloadActiveMetrics - re-fire the active metrics selection (no-op when none).
 * @param {import('vue').Ref<string>} deps.selectedView - THE single writable unified View value ('events:none' | 'metrics:x' | …). Derived controls (stackByField / selectedMetricsDashboard / isMetricsView) flow from this.
 * @param {import('vue').ComputedRef<string|null>} [deps.selectedMetricsDashboard] - active metrics selection, DERIVED from selectedView (read-only). Used only to decide the activate-time metrics nudge.
 * @param {() => unknown} [deps.getInputsSnapshot] - returns a serializable snapshot of the reload-affecting inputs (filter/view/range/dataset/pageSize/…). Used by the `activate` guard (task 9.6, req 4.14) to skip a keep-alive re-activation reload when nothing that drives the list/metrics fetch changed while the tab was inactive. Omitting it preserves the historical unconditional-activate behaviour.
 */
export function useEventsExplorer({
  reloadListTableWithHash,
  loadData,
  reloadActiveMetrics,
  selectedView,
  selectedMetricsDashboard,
  getInputsSnapshot
}) {
  // Stable, order-insensitive serialization of a plain snapshot (primitives,
  // arrays, plain objects — the shape `getCurrentShareState` already produces).
  // Object keys are sorted so that two structurally-equal snapshots compare
  // equal regardless of insertion order. This is deliberately narrow: the
  // snapshot is a serializable projection of the reload inputs, not arbitrary
  // reactive state — so a stringify-with-sorted-keys is exact and avoids a
  // deep-equal dependency (design §3.7).
  const stableStringify = (value) => {
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
    const keys = Object.keys(value).sort()
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }

  const snapshot = () => {
    if (typeof getInputsSnapshot !== 'function') return null
    try {
      return stableStringify(getInputsSnapshot())
    } catch {
      // A snapshot that cannot be serialized is treated as "unknown" → the
      // guard falls back to reloading (never silently skips on ambiguity).
      return null
    }
  }

  // Fingerprint of the reload-affecting inputs at the last load-producing
  // reload. `null` (initial) never equals a real snapshot, so the first
  // activate after mount is never wrongly skipped.
  let lastLoadedSnapshot = null

  // Record the inputs whenever a reload actually issues a load. The `activate`
  // guard diffs against this on the next re-activation.
  const rememberInputs = () => {
    lastLoadedSnapshot = snapshot()
  }
  // Apply a View intent by writing the ONE writable view source, `selectedView`
  // (task 9.4, design §3.6). The derived controls (`stackByField`,
  // `selectedMetricsDashboard`, `isMetricsView`) recompute automatically off
  // `selectedView` — this seam no longer mutates them independently. When the
  // intent originates from a user View change, the resulting `selectedView`
  // value is identical to the one just set, so the `watch(selectedView)` in
  // useViewSync does not re-fire (no reload loop). The reload itself is issued
  // once, centrally, right after, by reload('view').
  const applyViewIntent = (intent) => {
    const { scheme, key } = intent || parseView(selectedView?.value)
    const nextView = encodeView({ scheme, key })
    if (selectedView && selectedView.value !== nextView) selectedView.value = nextView
  }

  const isMetricsSelected = () =>
    parseView(selectedView?.value).scheme === 'metrics' ||
    !!(selectedMetricsDashboard && selectedMetricsDashboard.value)

  /**
   * The ONE reload entry. Every consumer (lifecycle, filter CRUD, view change,
   * brush, page-size, overlays, prune) calls this instead of poking a loader
   * directly.
   *
   * @param {ReloadReason} reason
   * @param {Object} [payload]
   * @param {{scheme:'events'|'metrics', key:string}} [payload.intent] - only for reason 'view'.
   */
  const reload = (reason, payload = {}) => {
    switch (reason) {
      case 'view': {
        // Interpret the intent emitted by the View selector, set the derived
        // controls, then issue exactly one events-list load (which co-fires the
        // events chart aggregation ONCE). When the intent selects a metrics
        // view, metrics loads through the selectedMetricsDashboard watch in
        // useChartConfig and the events chart-agg co-fire is suppressed by the
        // isMetricsView-driven gate (it is never displayed).
        applyViewIntent(payload.intent)
        reloadListTableWithHash()
        rememberInputs()
        return
      }

      case 'page-size': {
        // Page size does not change the aggregation window, so the chart is
        // untouched — load the list only, in memory (no hash write), and skip
        // the co-fired chart aggregation so a page-size change never re-runs it.
        loadData({ skipChart: true })
        rememberInputs()
        return
      }

      case 'mount': {
        // Initial mount: load the list in memory (the URL hash was already read
        // by refreshFilterData in onBeforeMount — do NOT rewrite it here). The
        // chart aggregation co-fires once through load(); metrics, if a metrics
        // view was hydrated, loads through the selectedMetricsDashboard watch.
        loadData()
        rememberInputs()
        return
      }

      case 'activate': {
        // Keep-alive re-activation (task 9.6, req 4.14). Reload the list in
        // memory (no hash write — the hash already reflects this tab) and nudge
        // metrics if a metrics view is active, BUT only when the reload-affecting
        // inputs (filter/view/range/dataset/pageSize/…) actually changed while
        // the tab was inactive. If they are identical to the last load, the
        // buffered result is already current, so re-fetching would waste a
        // round-trip and flash the same data. This intentionally replaces the
        // previous unconditional-activate behaviour.
        //
        // When no snapshot seam is injected (`getInputsSnapshot` absent), or the
        // inputs are unknown/unserializable, the guard falls back to reloading —
        // it never skips on ambiguity, and the first activate after mount is
        // never skipped (initial mount reload is unaffected).
        const current = snapshot()
        const inputsUnchanged = current !== null && current === lastLoadedSnapshot
        if (inputsUnchanged) return

        loadData()
        if (isMetricsSelected()) reloadActiveMetrics()
        rememberInputs()
        return
      }

      case 'filter':
      case 'range':
      case 'brush':
      case 'query-history':
      case 'saved-search':
      case 'prune':
      default: {
        // Hash-writing list reload. The events chart aggregation co-fires once
        // (suppressed only under a metrics view, where it is not displayed —
        // metrics itself reloads through the filterData watch in useChartConfig).
        reloadListTableWithHash()
        rememberInputs()
        return
      }
    }
  }

  return { reload, applyViewIntent, RELOAD_REASONS }
}
