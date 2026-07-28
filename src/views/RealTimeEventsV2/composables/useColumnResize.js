import { onBeforeUnmount, onDeactivated } from 'vue'

/**
 * `useColumnResize` — drag-to-resize the virtual table columns, mirroring
 * PrimeVue `columnResizeMode="expand"`. Raw mousemove is coalesced into a single
 * rAF width write per frame; teardown is keep-alive-symmetric.
 *
 * @param {Object} options
 * @param {import('vue').Ref<number>} options.timeWidth Time column width (px).
 * @param {import('vue').Ref<Object>} options.fieldWidths Per-field width overrides.
 * @param {(fieldName: string) => number} options.columnWidthOf Current field width.
 * @param {() => void} [options.onResizeEnd] Runs after the final width flush
 *   (host wraps `forceRemeasure` + row re-measure).
 * @returns {{ startResize: (event: MouseEvent, target: string) => void }}
 */
export function useColumnResize({ timeWidth, fieldWidths, columnWidthOf, onResizeEnd = () => {} }) {
  let resizeState = null
  let resizeRaf = 0

  // Apply the pending width from the latest mousemove — one width write per frame.
  const applyPendingWidth = () => {
    resizeRaf = 0
    if (!resizeState || resizeState.pending == null) return
    const next = resizeState.pending
    if (resizeState.target === 'time') timeWidth.value = next
    else fieldWidths.value = { ...fieldWidths.value, [resizeState.target]: next }
  }

  const cancelResizeRaf = () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf)
    resizeRaf = 0
  }

  // Coalesce raw mousemove into a single rAF write — a per-event width write
  // forces a full table re-render on every mouse tick.
  const onResizeMove = (event) => {
    if (!resizeState) return
    const delta = event.clientX - resizeState.startX
    resizeState.pending = Math.max(60, resizeState.startWidth + delta)
    if (!resizeRaf) resizeRaf = requestAnimationFrame(applyPendingWidth)
  }

  const endResize = () => {
    window.removeEventListener('mousemove', onResizeMove)
    window.removeEventListener('mouseup', endResize)
    // Flush the last pending width BEFORE remeasuring so heights reflect it.
    cancelResizeRaf()
    applyPendingWidth()
    resizeState = null
    // Widths changed → row heights may reflow; the host drops measured heights
    // and re-measures (mirrors §12.2 forceRemeasure).
    onResizeEnd()
  }

  const startResize = (event, target) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = target === 'time' ? timeWidth.value : columnWidthOf(target)
    resizeState = { target, startX, startWidth, pending: null }
    window.addEventListener('mousemove', onResizeMove)
    window.addEventListener('mouseup', endResize)
  }

  onBeforeUnmount(() => {
    cancelResizeRaf()
    if (resizeState) endResize()
  })
  onDeactivated(() => {
    cancelResizeRaf()
    if (resizeState) endResize()
  })

  return { startResize }
}
