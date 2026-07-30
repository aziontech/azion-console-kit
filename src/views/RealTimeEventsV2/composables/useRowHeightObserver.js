import { nextTick } from 'vue'
import { useKeepAliveResource } from '@/composables/useKeepAliveResource.js'

/**
 * `useRowHeightObserver` — one shared ResizeObserver that measures each mounted
 * `<tr>` and feeds heights to the windower's `measureRow` (design §12.2). Owns no
 * DOM: the host binds rows via the returned `:ref` factories. Lifecycle is
 * keep-alive-symmetric so the observer never leaks or stacks.
 *
 * @param {Object} options
 * @param {(key: (string|number), height: number, opts?: { expansion?: boolean }) => void} options.measureRow
 *   Windower height sink.
 * @returns {{
 *   setRowBaseEl: (rowId: (string|number)) => (el: Element|null) => void,
 *   setRowExpansionEl: (rowId: (string|number)) => (el: Element|null) => void,
 *   readAllRowHeights: () => void
 * }}
 */
export function useRowHeightObserver({ measureRow }) {
  const rowRefEls = new Map() // rowId -> { base: el, expansion: el|null }
  const rowIdByEl = new WeakMap() // el -> rowId (O(1) reverse lookup for the RO)
  let rowHeightObserver = null

  const readRowHeights = (rowId) => {
    const entry = rowRefEls.get(rowId)
    if (!entry) return
    if (entry.base) measureRow(rowId, entry.base.getBoundingClientRect().height)
    if (entry.expansion) {
      measureRow(rowId, entry.expansion.getBoundingClientRect().height, { expansion: true })
    }
  }

  const setRowEl = (rowId, kind, el) => {
    if (rowId == null) return
    let entry = rowRefEls.get(rowId)
    if (el) {
      if (!entry) {
        entry = { base: null, expansion: null }
        rowRefEls.set(rowId, entry)
      }
      // The inline :ref fires on every re-render with the SAME element; short-
      // circuit so we don't re-observe and re-schedule a measure each render
      // (fix C8 — kills the per-render nextTick(readRowHeights) churn).
      if (entry[kind] === el) return
      entry[kind] = el
      rowIdByEl.set(el, rowId)
      rowHeightObserver?.observe(el)
      nextTick(() => readRowHeights(rowId))
    } else if (entry) {
      const prev = entry[kind]
      if (prev) {
        rowHeightObserver?.unobserve(prev)
        rowIdByEl.delete(prev)
      }
      entry[kind] = null
      if (!entry.base && !entry.expansion) rowRefEls.delete(rowId)
    }
  }

  const setRowBaseEl = (rowId) => (el) => setRowEl(rowId, 'base', el)
  const setRowExpansionEl = (rowId) => (el) => setRowEl(rowId, 'expansion', el)

  /** Re-measure every currently-registered row (e.g. at the end of a resize). */
  const readAllRowHeights = () => {
    for (const rowId of rowRefEls.keys()) readRowHeights(rowId)
  }

  // Single observer for the whole table, acquired on mount/activate and released
  // on unmount/deactivate (symmetric — no per-row observers, no keep-alive leak).
  useKeepAliveResource(
    () => {
      if (typeof ResizeObserver === 'undefined') return null
      rowHeightObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const rowId = rowIdByEl.get(entry.target)
          if (rowId !== undefined) readRowHeights(rowId)
        }
      })
      // Re-observe rows registered before/around acquire (keep-alive restore).
      for (const refs of rowRefEls.values()) {
        if (refs.base) rowHeightObserver.observe(refs.base)
        if (refs.expansion) rowHeightObserver.observe(refs.expansion)
      }
      return rowHeightObserver
    },
    () => {
      rowHeightObserver?.disconnect()
      rowHeightObserver = null
    }
  )

  return { setRowBaseEl, setRowExpansionEl, readAllRowHeights }
}
