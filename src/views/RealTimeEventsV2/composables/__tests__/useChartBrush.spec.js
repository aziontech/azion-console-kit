import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useChartBrush } from '../useChartBrush'

/**
 * Unit tests for useChartBrush (task 7.4 extraction).
 *
 * The end-to-end brush → brush-select contract is already guarded at the
 * component level by event-chart.brush-select.spec.js. These tests exercise
 * the composable in isolation through its geometry seam (getRect/getOffsetWidth)
 * to pin the parts that are awkward to reach from the mounted component: the
 * touch tap-to-tooltip path, the drag-vs-tap promotion, and symmetric teardown.
 *
 * TZ=UTC required (dates compared by ms).
 */

const T0 = '2026-07-01T00:00:00.000Z'
const T_END = '2026-07-01T12:00:00.000Z'
const T0_MS = new Date(T0).getTime()
const RANGE_MS = new Date(T_END).getTime() - T0_MS

const WIDTH = 1000

const makeRect = () => ({
  left: 0,
  top: 0,
  right: WIDTH,
  bottom: 300,
  width: WIDTH,
  height: 300,
  px: 0,
  py: 0,
  toJSON() {}
})

// eslint-disable-next-line id-length
const evt = (type, { clientX = 0, clientY = 0, pointerType = 'mouse' } = {}) => ({
  type,
  clientX,
  clientY,
  pointerType,
  pointerId: 1,
  target: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() }
})

const setup = (overrides = {}) => {
  const onBrushSelect = vi.fn()
  const tooltip = { show: vi.fn(), hide: vi.fn() }
  const brush = useChartBrush({
    getRect: () => makeRect(),
    getOffsetWidth: () => WIDTH,
    getRangeBegin: () => T0,
    getRangeEnd: () => T_END,
    getChartInstance: () => ({ tooltip }),
    onBrushSelect,
    ...overrides
  })
  return { brush, onBrushSelect, tooltip }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useChartBrush — mouse drag → brush-select', () => {
  it('maps a left→right drag to a { begin, end } Date range', () => {
    const { brush, onBrushSelect } = setup()
    brush.handlePointerDown(evt('pointerdown', { clientX: 200 }))
    brush.handlePointerMove(evt('pointermove', { clientX: 800 }))
    brush.handlePointerUp(evt('pointerup', { clientX: 800 }))

    expect(onBrushSelect).toHaveBeenCalledTimes(1)
    const { begin, end } = onBrushSelect.mock.calls[0][0]
    expect(begin.getTime()).toBe(T0_MS + 0.2 * RANGE_MS)
    expect(end.getTime()).toBe(T0_MS + 0.8 * RANGE_MS)
  })

  it('suppresses a drag narrower than 5% of the width', () => {
    const { brush, onBrushSelect } = setup()
    brush.handlePointerDown(evt('pointerdown', { clientX: 500 }))
    brush.handlePointerMove(evt('pointermove', { clientX: 530 }))
    brush.handlePointerUp(evt('pointerup', { clientX: 530 }))
    expect(onBrushSelect).not.toHaveBeenCalled()
  })

  it('suppresses when the time-range window is absent', () => {
    const { brush, onBrushSelect } = setup({
      getRangeBegin: () => null,
      getRangeEnd: () => null
    })
    brush.handlePointerDown(evt('pointerdown', { clientX: 200 }))
    brush.handlePointerMove(evt('pointermove', { clientX: 800 }))
    brush.handlePointerUp(evt('pointerup', { clientX: 800 }))
    expect(onBrushSelect).not.toHaveBeenCalled()
  })
})

describe('useChartBrush — touch tap vs drag', () => {
  it('a touch tap (no move) shows the tooltip and schedules a 3s auto-dismiss', () => {
    const { brush, tooltip, onBrushSelect } = setup()
    brush.handlePointerDown(evt('pointerdown', { clientX: 400, pointerType: 'touch' }))
    brush.handlePointerUp(evt('pointerup', { clientX: 400, pointerType: 'touch' }))

    expect(tooltip.show).toHaveBeenCalledTimes(1)
    expect(onBrushSelect).not.toHaveBeenCalled()

    vi.advanceTimersByTime(3000)
    expect(tooltip.hide).toHaveBeenCalled()
  })

  it('a touch move past the threshold promotes to a drag and emits brush-select', () => {
    const { brush, onBrushSelect } = setup()
    brush.handlePointerDown(evt('pointerdown', { clientX: 200, pointerType: 'touch' }))
    brush.handlePointerMove(evt('pointermove', { clientX: 800, pointerType: 'touch' }))
    brush.handlePointerUp(evt('pointerup', { clientX: 800, pointerType: 'touch' }))

    expect(onBrushSelect).toHaveBeenCalledTimes(1)
    const { begin, end } = onBrushSelect.mock.calls[0][0]
    expect(begin.getTime()).toBeLessThan(end.getTime())
  })
})

describe('useChartBrush — teardown', () => {
  it('clears the pending tooltip auto-dismiss timer so it never fires after teardown', () => {
    const { brush, tooltip } = setup()
    brush.handlePointerDown(evt('pointerdown', { clientX: 400, pointerType: 'touch' }))
    brush.handlePointerUp(evt('pointerup', { clientX: 400, pointerType: 'touch' }))
    tooltip.hide.mockClear()

    brush.teardown()
    vi.advanceTimersByTime(5000)
    expect(tooltip.hide).not.toHaveBeenCalled()
  })

  it('resets gesture state on teardown', () => {
    const { brush } = setup()
    brush.handlePointerDown(evt('pointerdown', { clientX: 200 }))
    brush.handlePointerMove(evt('pointermove', { clientX: 500 }))
    expect(brush.isDragging.value).toBe(true)

    brush.teardown()
    expect(brush.isDragging.value).toBe(false)
    expect(brush.dragStartX.value).toBeNull()
    expect(brush.dragEndX.value).toBeNull()
  })
})
