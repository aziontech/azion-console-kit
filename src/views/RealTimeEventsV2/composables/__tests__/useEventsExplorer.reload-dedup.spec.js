import { describe, it, expect, vi } from 'vitest'
import { ref, computed } from 'vue'
import { useEventsExplorer, RELOAD_REASONS } from '../useEventsExplorer'
import { parseViewValue } from '../useChartConfig'

// ─────────────────────────────────────────────────────────────────────────────
// Property 4 (P4, tasks.md Fase 3): one user action ⇒ ≤1 events-list fetch AND
// ≤1 metrics fetch, and the events chart aggregation runs exactly once when it
// runs at all (never the historical 2×).
//
// useEventsExplorer.reload(reason) is the single funnel. It delegates to two
// events-list entry points and one metrics entry point (all injected — DIP):
//   - reloadListTableWithHash → hash write + events-list load (co-fires chart)
//   - loadData({skipChart})   → in-memory events-list load (skipChart suppresses
//                               the co-fired chart aggregation)
//   - reloadActiveMetrics     → re-fire the active metrics selection
//
// This suite asserts the delegation matrix per reason: exactly ONE events-list
// entry is invoked exactly ONCE, metrics is invoked at most once, and the chart
// co-fire is suppressed for the reasons where the chart result is wasted
// (page-size, metrics view).
//
// EXPECTED IN-SCOPE CHANGE (task 9.4 / design §3.6, called out per
// tests-on-demand): the View is now single-source-of-truth. `selectedView` is
// the ONLY writable view state; `stackByField` / `selectedMetricsDashboard` are
// read-only computeds derived from it (previously separate writable refs the
// seam mutated directly). `applyViewIntent` therefore writes `selectedView`, and
// the derived controls recompute. The view→events / view→metrics assertions
// below still pin the SAME expected control values — they now verify the SoT
// derivation instead of the old dual-write.
// ─────────────────────────────────────────────────────────────────────────────

const makeSeam = ({ metricsSelected = false, inputs } = {}) => {
  const reloadListTableWithHash = vi.fn()
  const loadData = vi.fn()
  const reloadActiveMetrics = vi.fn()
  // View SoT (task 9.4): `selectedView` is the ONLY writable view state; the
  // derived controls are read-only computeds off it — mirrors useViewSync.
  const selectedView = ref(metricsSelected ? 'metrics:wafThreats' : 'events:none')
  const parsed = computed(() => parseViewValue(selectedView.value))
  const stackByField = computed(() =>
    parsed.value.scheme === 'events' ? parsed.value.key : 'none'
  )
  const selectedMetricsDashboard = computed(() =>
    parsed.value.scheme === 'metrics' ? parsed.value.key : null
  )

  // Mutable inputs snapshot seam (task 9.6, req 4.14). Mirrors
  // getCurrentShareState in tab-panel-block: a serializable projection of the
  // reload-affecting inputs (filters/dataset/pageSize/selectedFields/…). Tests
  // mutate `inputsRef.value` between reloads to simulate inputs changing (or
  // NOT changing) while the tab was inactive under keep-alive.
  const inputsRef = ref(inputs ?? { filters: null, dataset: 'httpEvents', pageSize: 100 })

  const { reload, applyViewIntent } = useEventsExplorer({
    reloadListTableWithHash,
    loadData,
    reloadActiveMetrics,
    selectedView,
    selectedMetricsDashboard,
    getInputsSnapshot: () => inputsRef.value
  })

  // Count total events-list fetches across BOTH entry points, and how many of
  // those suppressed the chart co-fire.
  const listFetches = () => reloadListTableWithHash.mock.calls.length + loadData.mock.calls.length
  const chartSuppressedFetches = () =>
    loadData.mock.calls.filter(([opts]) => opts && opts.skipChart === true).length

  return {
    reload,
    applyViewIntent,
    reloadListTableWithHash,
    loadData,
    reloadActiveMetrics,
    selectedView,
    stackByField,
    selectedMetricsDashboard,
    inputsRef,
    listFetches,
    chartSuppressedFetches
  }
}

describe('useEventsExplorer.reload — dedup matrix (P4)', () => {
  it('exposes the full enumerated reason list', () => {
    expect(RELOAD_REASONS).toEqual([
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
  })

  it('every non-page-size reason performs exactly one events-list fetch and no unexpected metrics fetch', () => {
    const hashReasons = [
      'view',
      'filter',
      'range',
      'brush',
      'query-history',
      'saved-search',
      'prune'
    ]
    hashReasons.forEach((reason) => {
      const seam = makeSeam()
      const payload = reason === 'view' ? { intent: { scheme: 'events', key: 'none' } } : undefined
      seam.reload(reason, payload)
      expect(seam.listFetches(), `${reason}: one events-list fetch`).toBe(1)
      // Events-only view: no metrics re-fire from the seam.
      expect(seam.reloadActiveMetrics, `${reason}: no metrics fetch`).not.toHaveBeenCalled()
    })
  })

  it('mount → in-memory list load (no hash write), one events-list fetch', () => {
    const seam = makeSeam()
    seam.reload('mount')
    expect(seam.loadData).toHaveBeenCalledTimes(1)
    expect(seam.reloadListTableWithHash).not.toHaveBeenCalled()
    expect(seam.listFetches()).toBe(1)
    expect(seam.reloadActiveMetrics).not.toHaveBeenCalled()
  })

  it('view→events: applies stack-by, one hash reload, chart co-fires (not suppressed)', () => {
    const seam = makeSeam()
    seam.reload('view', { intent: { scheme: 'events', key: 'status' } })
    expect(seam.stackByField.value).toBe('status')
    expect(seam.selectedMetricsDashboard.value).toBeNull()
    expect(seam.reloadListTableWithHash).toHaveBeenCalledTimes(1)
    // No skipChart on the hash-reload path → chart aggregation co-fires once.
    expect(seam.chartSuppressedFetches()).toBe(0)
    expect(seam.listFetches()).toBe(1)
  })

  it('view→metrics: sets dashboard, one hash reload, metrics loads via selection watch (not the seam)', () => {
    const seam = makeSeam()
    seam.reload('view', { intent: { scheme: 'metrics', key: 'wafThreats' } })
    expect(seam.selectedMetricsDashboard.value).toBe('wafThreats')
    expect(seam.stackByField.value).toBe('none')
    expect(seam.reloadListTableWithHash).toHaveBeenCalledTimes(1)
    expect(seam.listFetches()).toBe(1)
    // The seam does NOT re-fire metrics on a view change — the
    // selectedMetricsDashboard watch in useChartConfig does (≤1 metrics).
    expect(seam.reloadActiveMetrics).not.toHaveBeenCalled()
  })

  it('page-size: single in-memory list load with chart aggregation suppressed', () => {
    const seam = makeSeam()
    seam.reload('page-size')
    expect(seam.loadData).toHaveBeenCalledTimes(1)
    expect(seam.loadData).toHaveBeenCalledWith({ skipChart: true })
    expect(seam.reloadListTableWithHash).not.toHaveBeenCalled()
    expect(seam.listFetches()).toBe(1)
    // Chart-agg suppressed for the whole action.
    expect(seam.chartSuppressedFetches()).toBe(1)
    expect(seam.reloadActiveMetrics).not.toHaveBeenCalled()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Task 9.6 (req 4.14) — reactivation must NOT reload when the reload-affecting
  // inputs are unchanged. FLIPPED from the previous unconditional-activate
  // contract: these two tests previously asserted `reload('activate')` ALWAYS
  // fired one loadData (events view) / one loadData + one reloadActiveMetrics
  // (metrics view). They now assert the guarded contract: after a load has
  // captured the inputs, an activate with IDENTICAL inputs is a no-op, and only
  // an activate with CHANGED inputs re-fetches. The ≤1-fetch coverage is kept by
  // asserting exactly one load on the changed-inputs path (no over-fetch).
  // ───────────────────────────────────────────────────────────────────────────

  it('activate (events view): no reload when inputs are unchanged since the last load', () => {
    const seam = makeSeam({ metricsSelected: false })
    // Establish the last-loaded input fingerprint (a mount reload captures it).
    seam.reload('mount')
    expect(seam.loadData).toHaveBeenCalledTimes(1)
    seam.loadData.mockClear()

    // Re-activation with identical inputs → skipped entirely (no over-fetch).
    seam.reload('activate')
    expect(seam.loadData).not.toHaveBeenCalled()
    expect(seam.listFetches()).toBe(0) // no NEW list fetch beyond the (cleared) mount load
    expect(seam.reloadActiveMetrics).not.toHaveBeenCalled()
  })

  it('activate (events view): exactly one in-memory list load when inputs changed', () => {
    const seam = makeSeam({ metricsSelected: false })
    seam.reload('mount')
    seam.loadData.mockClear()

    // Simulate an input change while the tab was inactive (e.g. pageSize/filter).
    seam.inputsRef.value = { ...seam.inputsRef.value, pageSize: 250 }
    seam.reload('activate')
    expect(seam.loadData).toHaveBeenCalledTimes(1)
    expect(seam.reloadActiveMetrics).not.toHaveBeenCalled()
  })

  it('activate (metrics view): no reload and no metrics nudge when inputs are unchanged', () => {
    const seam = makeSeam({ metricsSelected: true })
    seam.reload('mount')
    seam.loadData.mockClear()

    seam.reload('activate')
    expect(seam.loadData).not.toHaveBeenCalled()
    expect(seam.reloadActiveMetrics).not.toHaveBeenCalled()
  })

  it('activate (metrics view): exactly one list load AND exactly one metrics nudge when inputs changed', () => {
    const seam = makeSeam({ metricsSelected: true })
    seam.reload('mount')
    seam.loadData.mockClear()

    seam.inputsRef.value = { ...seam.inputsRef.value, pageSize: 250 }
    seam.reload('activate')
    expect(seam.loadData).toHaveBeenCalledTimes(1)
    expect(seam.listFetches()).toBe(1)
    // ≤1 metrics: exactly one re-fire of the active selection.
    expect(seam.reloadActiveMetrics).toHaveBeenCalledTimes(1)
  })

  it('activate: reloads (does not silently skip) when no inputs snapshot seam is available', () => {
    // Fallback contract: if getInputsSnapshot is absent/unserializable the guard
    // never skips on ambiguity — activate behaves as an unconditional reload.
    const reloadListTableWithHash = vi.fn()
    const loadData = vi.fn()
    const reloadActiveMetrics = vi.fn()
    const selectedView = ref('events:none')
    const { reload } = useEventsExplorer({
      reloadListTableWithHash,
      loadData,
      reloadActiveMetrics,
      selectedView
    })
    reload('mount')
    loadData.mockClear()
    reload('activate')
    expect(loadData).toHaveBeenCalledTimes(1)
  })

  it('brush: one hash reload (metrics rides the filterData watch, not the seam)', () => {
    const seam = makeSeam({ metricsSelected: true })
    seam.reload('brush')
    expect(seam.reloadListTableWithHash).toHaveBeenCalledTimes(1)
    expect(seam.listFetches()).toBe(1)
    // The seam never calls the metrics loader for brush — the tsRange mutation
    // done by handleBrushSelect drives the single metrics reload elsewhere.
    expect(seam.reloadActiveMetrics).not.toHaveBeenCalled()
  })
})
