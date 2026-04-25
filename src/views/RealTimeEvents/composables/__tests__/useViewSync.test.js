import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useViewSync } from '../useViewSync'

describe('useViewSync', () => {
  const setup = () => {
    const selectedMetricsDashboard = ref(null)
    const stackByField = ref('none')
    const reloadListTableWithHash = vi.fn()

    const { selectedView, isMetricsView } = useViewSync({
      selectedMetricsDashboard,
      stackByField,
      reloadListTableWithHash
    })

    return { selectedView, isMetricsView, selectedMetricsDashboard, stackByField, reloadListTableWithHash }
  }

  it('initialises selectedView to "events:none"', () => {
    const { selectedView } = setup()
    expect(selectedView.value).toBe('events:none')
  })

  it('initialises isMetricsView to false', () => {
    const { isMetricsView } = setup()
    expect(isMetricsView.value).toBe(false)
  })

  describe('when selectedView changes to an events value', () => {
    it('sets stackByField to the key and clears selectedMetricsDashboard', async () => {
      const { selectedView, stackByField, selectedMetricsDashboard, reloadListTableWithHash } = setup()
      selectedMetricsDashboard.value = 'wafThreats'

      selectedView.value = 'events:status'
      await nextTick()

      expect(stackByField.value).toBe('status')
      expect(selectedMetricsDashboard.value).toBeNull()
      expect(reloadListTableWithHash).toHaveBeenCalled()
    })

    it('defaults stackByField to "none" when key is empty', async () => {
      const { selectedView, stackByField, reloadListTableWithHash } = setup()

      selectedView.value = 'events:'
      await nextTick()

      expect(stackByField.value).toBe('none')
      expect(reloadListTableWithHash).toHaveBeenCalled()
    })

    it('sets isMetricsView to false', async () => {
      const { selectedView, isMetricsView } = setup()

      selectedView.value = 'events:requestMethod'
      await nextTick()

      expect(isMetricsView.value).toBe(false)
    })
  })

  describe('when selectedView changes to a metrics value', () => {
    it('sets selectedMetricsDashboard to the key and resets stackByField', async () => {
      const { selectedView, stackByField, selectedMetricsDashboard, reloadListTableWithHash } = setup()
      stackByField.value = 'status'

      selectedView.value = 'metrics:wafThreats'
      await nextTick()

      expect(selectedMetricsDashboard.value).toBe('wafThreats')
      expect(stackByField.value).toBe('none')
      expect(reloadListTableWithHash).toHaveBeenCalled()
    })

    it('sets isMetricsView to true', async () => {
      const { selectedView, isMetricsView } = setup()

      selectedView.value = 'metrics:botTraffic'
      await nextTick()

      expect(isMetricsView.value).toBe(true)
    })
  })

  describe('when selectedView is set back to events from metrics', () => {
    it('clears selectedMetricsDashboard and updates stackByField', async () => {
      const { selectedView, stackByField, selectedMetricsDashboard, reloadListTableWithHash } = setup()

      selectedView.value = 'metrics:wafThreats'
      await nextTick()
      expect(selectedMetricsDashboard.value).toBe('wafThreats')

      reloadListTableWithHash.mockClear()
      selectedView.value = 'events:none'
      await nextTick()

      expect(selectedMetricsDashboard.value).toBeNull()
      expect(stackByField.value).toBe('none')
      expect(reloadListTableWithHash).toHaveBeenCalledTimes(1)
    })
  })

  it('calls reloadListTableWithHash on every view change', async () => {
    const { selectedView, reloadListTableWithHash } = setup()

    selectedView.value = 'events:status'
    await nextTick()
    selectedView.value = 'metrics:wafThreats'
    await nextTick()
    selectedView.value = 'events:none'
    await nextTick()

    expect(reloadListTableWithHash).toHaveBeenCalledTimes(3)
  })
})
