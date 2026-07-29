import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { useViewSync } from '../useViewSync'

// ─────────────────────────────────────────────────────────────────────────────
// useViewSync — intent-emitting contract (post task 7.3, design §3.8/§7.5).
//
// EXPECTED IN-SCOPE CHANGE (called out per tests-on-demand): before 7.3 this
// composable mutated the derived controls (stackByField / selectedMetricsDashboard)
// AND called reloadListTableWithHash on every view change. That direct reload,
// combined with the stackByField write tripping a separate watch(stackByField)
// -> loadChart, was the source of the events-view double chart-agg.
//
// It now EMITS the parsed intent `{scheme, key}` to the single reload seam via
// `onIntent`; the seam (useEventsExplorer) owns the derived-control mutation and
// the single reload. So this suite asserts the INTENT contract instead of the old
// mutate-and-reload behaviour. The mutation itself is covered by the explorer
// tests (useEventsExplorer.reload-dedup.spec.js).
// ─────────────────────────────────────────────────────────────────────────────

describe('useViewSync (intent emission)', () => {
  const setup = () => {
    const onIntent = vi.fn()
    const { selectedView, isMetricsView, stackByField, selectedMetricsDashboard } = useViewSync({
      onIntent
    })
    return { selectedView, isMetricsView, stackByField, selectedMetricsDashboard, onIntent }
  }

  it('initialises selectedView to "events:none"', () => {
    const { selectedView } = setup()
    expect(selectedView.value).toBe('events:none')
  })

  it('initialises isMetricsView to false', () => {
    const { isMetricsView } = setup()
    expect(isMetricsView.value).toBe(false)
  })

  it('does not emit an intent on creation (no immediate)', () => {
    const { onIntent } = setup()
    expect(onIntent).not.toHaveBeenCalled()
  })

  describe('when selectedView changes to an events value', () => {
    it('emits an events intent carrying the stack-by key', async () => {
      const { selectedView, onIntent } = setup()

      selectedView.value = 'events:status'
      await nextTick()

      expect(onIntent).toHaveBeenCalledTimes(1)
      expect(onIntent).toHaveBeenLastCalledWith({ scheme: 'events', key: 'status' })
    })

    it('normalises an empty key to "none"', async () => {
      const { selectedView, onIntent } = setup()

      selectedView.value = 'events:'
      await nextTick()

      expect(onIntent).toHaveBeenLastCalledWith({ scheme: 'events', key: 'none' })
    })

    it('keeps isMetricsView false', async () => {
      const { selectedView, isMetricsView } = setup()

      selectedView.value = 'events:requestMethod'
      await nextTick()

      expect(isMetricsView.value).toBe(false)
    })
  })

  describe('when selectedView changes to a metrics value', () => {
    it('emits a metrics intent carrying the dashboard key', async () => {
      const { selectedView, onIntent } = setup()

      selectedView.value = 'metrics:wafThreats'
      await nextTick()

      expect(onIntent).toHaveBeenLastCalledWith({ scheme: 'metrics', key: 'wafThreats' })
    })

    it('sets isMetricsView to true', async () => {
      const { selectedView, isMetricsView } = setup()

      selectedView.value = 'metrics:botTraffic'
      await nextTick()

      expect(isMetricsView.value).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // View SoT (task 9.4 / design §3.6): `selectedView` is the ONLY writable view
  // state; stackByField / selectedMetricsDashboard / isMetricsView are read-only
  // computeds derived from it. useMetricsChart no longer owns selectedDashboard.
  // ───────────────────────────────────────────────────────────────────────────
  describe('derived view controls (single source of truth)', () => {
    it('initialises stackByField to "none" and selectedMetricsDashboard to null', () => {
      const { stackByField, selectedMetricsDashboard } = setup()
      expect(stackByField.value).toBe('none')
      expect(selectedMetricsDashboard.value).toBeNull()
    })

    it('derives stackByField from an events view (metrics selection stays null)', async () => {
      const { selectedView, stackByField, selectedMetricsDashboard } = setup()
      selectedView.value = 'events:status'
      await nextTick()
      expect(stackByField.value).toBe('status')
      expect(selectedMetricsDashboard.value).toBeNull()
    })

    it('derives selectedMetricsDashboard from a metrics view (stackByField resets to none)', async () => {
      const { selectedView, stackByField, selectedMetricsDashboard } = setup()
      selectedView.value = 'events:requestMethod'
      await nextTick()
      selectedView.value = 'metrics:wafThreats'
      await nextTick()
      expect(selectedMetricsDashboard.value).toBe('wafThreats')
      expect(stackByField.value).toBe('none')
    })

    it('derived controls are read-only computeds off selectedView (no independent writer)', async () => {
      const { selectedView, stackByField, selectedMetricsDashboard } = setup()
      selectedView.value = 'metrics:botTraffic'
      await nextTick()
      expect(selectedMetricsDashboard.value).toBe('botTraffic')
      // Switching back to events flips both derived controls in lockstep.
      selectedView.value = 'events:none'
      await nextTick()
      expect(selectedMetricsDashboard.value).toBeNull()
      expect(stackByField.value).toBe('none')
    })
  })

  it('emits exactly one intent per view change (no double-fire)', async () => {
    const { selectedView, onIntent } = setup()

    selectedView.value = 'events:status'
    await nextTick()
    selectedView.value = 'metrics:wafThreats'
    await nextTick()
    selectedView.value = 'events:none'
    await nextTick()

    expect(onIntent).toHaveBeenCalledTimes(3)
    expect(onIntent.mock.calls.map(([intent]) => intent)).toEqual([
      { scheme: 'events', key: 'status' },
      { scheme: 'metrics', key: 'wafThreats' },
      { scheme: 'events', key: 'none' }
    ])
  })
})
