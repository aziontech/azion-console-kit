import { ref } from 'vue'

/**
 * useChartBrush — pointer/brush/tooltip interaction for the events chart.
 *
 * Extracted from `event-chart.vue` (task 7.4) so the pixel→time brush mapping,
 * the 5% minimum-width suppression, and the touch tap-to-tooltip behavior live
 * in one testable unit. The chart component stays a thin shell that wires these
 * handlers onto the `.chart-container` and renders the selection overlay.
 *
 * PRESERVED CONTRACT (guarded by event-chart.brush-select.spec.js):
 *   - a mouse drag wider than 5% of the chart width emits ONE `brush-select`
 *     with `{ begin: Date, end: Date }`, begin < end regardless of drag
 *     direction, bounded by [tsRangeBegin, tsRangeEnd];
 *   - a drag narrower than 5%, or a missing time window, emits nothing;
 *   - a touch tap (< 4px movement) shows the c3 tooltip with a 3s auto-dismiss;
 *   - a touch move past the tap threshold promotes to a drag.
 *
 * SEAM: geometry is read through `getRect()` / `getOffsetWidth()` so the
 * pixel math is deterministic under test (jsdom reports zeros otherwise) and
 * decoupled from any specific DOM node. All timers/listeners are torn down by
 * the returned `teardown()`, which the owner MUST call symmetrically
 * (onBeforeUnmount + onDeactivated) to avoid leaks under <KeepAlive>.
 *
 * @param {object} options
 * @param {() => DOMRect|null} options.getRect - bounding rect of the geometry element.
 * @param {() => number} options.getOffsetWidth - offsetWidth of the geometry element.
 * @param {() => Date|string|null} options.getRangeBegin - current window start.
 * @param {() => Date|string|null} options.getRangeEnd - current window end.
 * @param {() => object|null} options.getChartInstance - live c3 instance (for tooltip).
 * @param {(range: {begin: Date, end: Date}) => void} options.onBrushSelect - commit callback.
 */
export function useChartBrush({
  getRect,
  getOffsetWidth,
  getRangeBegin,
  getRangeEnd,
  getChartInstance,
  onBrushSelect
}) {
  // Tap vs drag threshold in CSS pixels. Anything below is considered a tap
  // (touch shows the tooltip; mouse does nothing extra).
  const TAP_MOVEMENT_THRESHOLD_PX = 4
  // Brush must cover at least 5% of the chart width to fire brush-select.
  const BRUSH_MIN_WIDTH_RATIO = 0.05

  const isDragging = ref(false)
  const dragStartX = ref(null)
  const dragEndX = ref(null)
  const selectionOverlay = ref(null)
  // Track the latest pointer position (viewport coords) so the C3 tooltip
  // position callback can place the tooltip near the cursor on the opposite
  // Y side, never covering the hovered bar/line.
  // eslint-disable-next-line id-length
  const pointerPos = ref({ x: 0, y: 0, present: false })

  // Auto-dismiss timer for touch tap-to-show tooltip (3s per spec).
  let tooltipDismissTimer = null
  // Captures the pointer-down origin so we can classify the gesture in
  // pointerup as tap vs drag (< 4px movement = tap).
  let pointerDownAt = null

  const hideChartTooltip = () => {
    const instance = getChartInstance()
    if (!instance || !instance.tooltip || typeof instance.tooltip.hide !== 'function') return
    try {
      instance.tooltip.hide()
    } catch {
      /* noop — c3 may throw if no series is hovered */
    }
  }

  const clearTooltipDismissTimer = () => {
    if (tooltipDismissTimer !== null) {
      clearTimeout(tooltipDismissTimer)
      tooltipDismissTimer = null
    }
  }

  const showTouchTooltipAt = (clientX) => {
    const instance = getChartInstance()
    if (!instance || !instance.tooltip || typeof instance.tooltip.show !== 'function') return
    const rect = getRect()
    if (!rect) return
    const localX = clientX - rect.left
    try {
      // C3's tooltip.show accepts either `{ x: dataX }` or `{ mouse: [x, y] }`.
      // We pass the local pixel coordinate via `mouse` so c3 snaps to the
      // closest data point itself — keeps us agnostic to the x-axis scale.
      instance.tooltip.show({ mouse: [localX, rect.height / 2] })
    } catch {
      // If the c3 build doesn't support tap-to-show (older versions),
      // degrade silently per spec.
    }
  }

  const handlePointerDown = (event) => {
    const rect = getRect()
    if (!rect) return
    // Take ownership of the pointer so subsequent move/up events keep
    // firing on this element even if the finger slides off the canvas.
    try {
      event.target.setPointerCapture?.(event.pointerId)
    } catch {
      /* noop — some browsers reject capture in synthetic events */
    }
    const localX = event.clientX - rect.left
    /* eslint-disable id-length */
    pointerDownAt = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
      pointerType: event.pointerType
    }
    /* eslint-enable id-length */
    // A new tap cancels any pending auto-dismiss + currently shown tooltip.
    clearTooltipDismissTimer()
    if (event.pointerType === 'touch') {
      hideChartTooltip()
      // Touch defers brush initialization until we know it's a drag — a
      // tap should NOT leave a residual selection rectangle on the chart.
      return
    }
    isDragging.value = true
    dragStartX.value = localX
    dragEndX.value = localX
  }

  const handlePointerMove = (event) => {
    // Always record the latest pointer position for the tooltip positioner,
    // independent of the brush-selection drag state.
    // eslint-disable-next-line id-length
    pointerPos.value = { x: event.clientX, y: event.clientY, present: true }
    const rect = getRect()
    if (!rect) return
    const localX = Math.max(0, Math.min(event.clientX - rect.left, rect.width))

    // Touch: promote a sustained move into a drag once it crosses the tap
    // threshold. Until then we stay neutral so a tap stays a tap.
    if (event.pointerType === 'touch' && !isDragging.value && pointerDownAt) {
      const dx = event.clientX - pointerDownAt.x
      const dy = event.clientY - pointerDownAt.y
      if (Math.hypot(dx, dy) >= TAP_MOVEMENT_THRESHOLD_PX) {
        isDragging.value = true
        dragStartX.value = pointerDownAt.x - rect.left
        dragEndX.value = localX
      }
    }

    if (!isDragging.value) return
    dragEndX.value = localX
    updateSelectionOverlay()
  }

  const finishBrushIfAny = () => {
    if (!isDragging.value) return
    isDragging.value = false
    if (dragStartX.value !== null && dragEndX.value !== null) {
      const width = getOffsetWidth()
      const startPct = Math.min(dragStartX.value, dragEndX.value) / width
      const endPct = Math.max(dragStartX.value, dragEndX.value) / width
      const rangeBegin = getRangeBegin()
      const rangeEnd = getRangeEnd()
      if (Math.abs(endPct - startPct) > BRUSH_MIN_WIDTH_RATIO && rangeBegin && rangeEnd) {
        const begin = new Date(rangeBegin).getTime()
        const end = new Date(rangeEnd).getTime()
        const range = end - begin
        onBrushSelect({
          begin: new Date(begin + startPct * range),
          end: new Date(begin + endPct * range)
        })
      }
    }
    dragStartX.value = null
    dragEndX.value = null
    updateSelectionOverlay()
  }

  const handlePointerUp = (event) => {
    // Release the implicit capture from pointerdown.
    try {
      event.target.releasePointerCapture?.(event.pointerId)
    } catch {
      /* noop */
    }

    // Tap detection: touch + movement under threshold => show tooltip.
    if (event.pointerType === 'touch' && pointerDownAt) {
      const dx = event.clientX - pointerDownAt.x
      const dy = event.clientY - pointerDownAt.y
      const distance = Math.hypot(dx, dy)
      if (distance < TAP_MOVEMENT_THRESHOLD_PX && !isDragging.value) {
        showTouchTooltipAt(event.clientX)
        clearTooltipDismissTimer()
        tooltipDismissTimer = setTimeout(() => {
          tooltipDismissTimer = null
          hideChartTooltip()
        }, 3000)
        pointerDownAt = null
        return
      }
    }

    finishBrushIfAny()
    pointerDownAt = null
  }

  const handlePointerCancel = (event) => {
    try {
      event.target.releasePointerCapture?.(event.pointerId)
    } catch {
      /* noop */
    }
    clearTooltipDismissTimer()
    hideChartTooltip()
    pointerDownAt = null
    isDragging.value = false
    dragStartX.value = null
    dragEndX.value = null
    updateSelectionOverlay()
  }

  const handlePointerLeave = (event) => {
    // eslint-disable-next-line id-length
    pointerPos.value = { x: 0, y: 0, present: false }
    // Touch pointers don't really "leave" — they're either captured or done.
    // Treat leave as commit for mouse drags only; touch is handled by up/cancel.
    if (event.pointerType === 'touch') return
    finishBrushIfAny()
    pointerDownAt = null
  }

  const updateSelectionOverlay = () => {
    if (!selectionOverlay.value) return
    if (dragStartX.value === null || dragEndX.value === null || !isDragging.value) {
      selectionOverlay.value.style.display = 'none'
      return
    }
    const left = Math.min(dragStartX.value, dragEndX.value)
    const width = Math.abs(dragEndX.value - dragStartX.value)
    selectionOverlay.value.style.display = 'block'
    selectionOverlay.value.style.left = `${left}px`
    selectionOverlay.value.style.width = `${width}px`
  }

  // Symmetric teardown — the owner MUST call this on beforeUnmount AND
  // deactivate so the tap-to-tooltip timer and gesture state never leak
  // across keep-alive cycles.
  const teardown = () => {
    clearTooltipDismissTimer()
    pointerDownAt = null
    isDragging.value = false
    dragStartX.value = null
    dragEndX.value = null
  }

  return {
    BRUSH_MIN_WIDTH_RATIO,
    TAP_MOVEMENT_THRESHOLD_PX,
    selectionOverlay,
    pointerPos,
    isDragging,
    dragStartX,
    dragEndX,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    finishBrushIfAny,
    updateSelectionOverlay,
    hideChartTooltip,
    clearTooltipDismissTimer,
    teardown
  }
}
