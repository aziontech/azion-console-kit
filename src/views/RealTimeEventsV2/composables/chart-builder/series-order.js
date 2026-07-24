// ────────────────────────────────────────────────────────────────────────────
// SERIES-ORDER concern — stable stack ordering across re-renders.
//
// Cache of series ordering so that a given (stackKey, seriesSet) keeps a stable
// stack position across re-renders. Prevents c3 from visually reshuffling the
// stack when totals fluctuate between filter/range changes.
//
// De-singletonization (task 7.8): ordering is now cached PER-INSTANCE via
// `createSeriesOrderCache()`, which each `useChartBuilder` (one per EventChart /
// per tab) owns for its own lifetime. This removes the cross-tab bleed that the
// old module singleton caused, where one tab deactivating/unmounting cleared the
// ordering for every other live tab.
//
// A process-wide default cache is retained ONLY so the free `cachedOrder`
// re-export and `resetSeriesOrderCache` keep working until task 7.6 (Fase 3b)
// removes the lifecycle reset calls in tab-panel-block. No production call site
// relies on the singleton once `useChartBuilder` threads its own instance.
// ────────────────────────────────────────────────────────────────────────────

const SERIES_ORDER_CACHE_MAX = 50

/**
 * Create an isolated series-order cache. Each cache keeps a stable stack
 * ordering for the `(stackKey, seriesSet)` pairs it has seen, evicting the
 * oldest entry once it exceeds `SERIES_ORDER_CACHE_MAX`.
 *
 * Returned `cachedOrder` has the same contract as the historical module-level
 * function so it can be threaded into `buildMultiSeries` unchanged.
 *
 * @returns {{ cachedOrder: Function, clear: Function }}
 */
export function createSeriesOrderCache() {
  const store = new Map()

  const cachedOrder = (stackKey, seriesFields, computeOrdered) => {
    const setKey = `${stackKey}|${[...seriesFields].sort().join(',')}`
    const cached = store.get(setKey)
    if (cached) return cached
    // Evict oldest entries when the cache exceeds the limit.
    if (store.size >= SERIES_ORDER_CACHE_MAX) {
      const firstKey = store.keys().next().value
      store.delete(firstKey)
    }
    const ordered = computeOrdered()
    store.set(setKey, ordered)
    return ordered
  }

  const clear = () => store.clear()

  return { cachedOrder, clear }
}

// Process-wide default cache — legacy fallback for callers that don't thread an
// explicit per-instance cache (and for the `resetSeriesOrderCache` re-export).
const defaultCache = createSeriesOrderCache()

/**
 * Backwards-compatible free function. Prefer threading a per-instance cache
 * created via `createSeriesOrderCache()` (as `useChartBuilder` now does); this
 * form uses the shared default cache and only exists for legacy callers.
 */
export function cachedOrder(stackKey, seriesFields, computeOrdered) {
  return defaultCache.cachedOrder(stackKey, seriesFields, computeOrdered)
}

/**
 * Clears the process-wide default cache only. Per-instance caches created via
 * `createSeriesOrderCache()` are isolated and unaffected — they are cleared by
 * their owning composable. Retained as a no-op-safe reset so the tab-panel
 * lifecycle calls keep working until task 7.6 (Fase 3b) removes them.
 */
export function resetSeriesOrderCache() {
  defaultCache.clear()
}
