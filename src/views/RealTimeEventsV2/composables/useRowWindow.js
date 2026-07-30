import { ref, computed, unref, watch } from 'vue'
import { rowKey } from './utils/row-key'

/**
 * `useRowWindow` — variable-height row windower for the virtualized table
 * (design §12.2, task 3.2). Renders only rows intersecting the viewport (+
 * overscan) so mounted rows stay O(viewport) (req 1.1); heights are cached by
 * `row.id` (never index) and offsets use a prefix-sum + binary search. Owns no
 * DOM: the host feeds `scrollTop`/`viewportHeight` and calls `measureRow`.
 *
 * @template Row
 * @param {Object} options
 * @param {import('vue').Ref<Row[]> | (() => Row[])} options.logicalRows
 *   Reactive source of the rows to window (already sorted/filtered upstream).
 * @param {import('vue').Ref<number> | (() => number)} [options.scrollTop]
 *   Current scroll offset of the viewport, in px. The host wires this to its
 *   scroll container's `scrollTop` (kept as a plain reactive number so the
 *   composable stays DOM-free and unit-testable).
 * @param {import('vue').Ref<number> | (() => number)} [options.viewportHeight]
 *   Visible height of the scroll viewport, in px.
 * @param {import('vue').Ref<number> | (() => number) | number} [options.estimatedRowHeight=44]
 *   Height assumed for rows not yet measured; corrected once `measureRow` runs.
 * @param {number} [options.overscan=6]
 *   Fixed number of extra rows rendered above AND below the visible range.
 * @param {(row: Row) => (string | number)} [options.keyOf]
 *   Stable identity of a row (defaults to the shared `rowKey`: `row.id` else
 *   object identity).
 * @param {(row: Row) => boolean} [options.expandedKey]
 *   Whether a row currently shows its inline expansion band (adds its measured
 *   expansion height to the row's total). Defaults to always-false.
 * @param {import('vue').Ref<number> | (() => number)} [options.resetToken]
 *   Monotonic token; any change clears the measured-height cache (new
 *   query/filter/dataset). `append` must NOT bump it.
 * @param {(deltaPx: number) => void} [options.onAnchorAdjust]
 *   Called with the px delta the host should add to its container `scrollTop`
 *   to keep the first visible row anchored after an above-fold height change.
 *
 * @returns {{
 *   windowedRows: import('vue').ComputedRef<Array<{ row: Row, key: (string|number), index: number }>>,
 *   topSpacer: import('vue').ComputedRef<number>,
 *   bottomSpacer: import('vue').ComputedRef<number>,
 *   totalHeight: import('vue').ComputedRef<number>,
 *   measureRow: (key: (string|number), height: number, opts?: { expansion?: boolean }) => void,
 *   scrollToKey: (key: (string|number)) => (number | null),
 *   forceRemeasure: () => void,
 *   getRowHeight: (key: (string|number)) => number,
 *   offsetOf: (index: number) => number
 * }}
 */
export function useRowWindow({
  logicalRows,
  scrollTop = () => 0,
  viewportHeight = () => 0,
  estimatedRowHeight = 44,
  overscan = 6,
  keyOf = rowKey,
  expandedKey = () => false,
  resetToken = () => 0,
  onAnchorAdjust = () => {}
} = {}) {
  const readRows = () =>
    unref(typeof logicalRows === 'function' ? logicalRows() : logicalRows) ?? []
  const readScrollTop = () => Math.max(0, Number(resolve(scrollTop)) || 0)
  const readViewport = () => Math.max(0, Number(resolve(viewportHeight)) || 0)
  const readEstimate = () => {
    const value = Number(resolve(estimatedRowHeight))
    return value > 0 ? value : 44
  }
  const fixedOverscan = Math.max(0, Math.trunc(overscan))

  // Measured heights, keyed by row identity (never by index).
  const baseHeights = new Map() // key -> measured base row height (px)
  const expansionHeights = new Map() // key -> measured expansion-band height (px)

  // Reactive revision bumped whenever a measurement or reset mutates the caches,
  // so the derived prefix-sum recomputes. Mutating a plain Map is not reactive
  // on its own; this ref is the single reactivity signal for measurement state.
  const measureRevision = ref(0)

  const rowsRef = computed(() => readRows())

  // O(1) id→index lookup, rebuilt only when the row list itself changes (NOT on
  // measurement). Replaces the per-measurement O(n) rows.findIndex that made a
  // full scroll-through O(n²) (fix F3).
  const keyToIndex = computed(() => {
    const map = new Map()
    const rows = rowsRef.value
    for (let index = 0; index < rows.length; index += 1) map.set(keyOf(rows[index]), index)
    return map
  })

  const heightFor = (row) => {
    const key = keyOf(row)
    const base = baseHeights.has(key) ? baseHeights.get(key) : readEstimate()
    const expansion = expandedKey(row) ? expansionHeights.get(key) || 0 : 0
    return base + expansion
  }

  /**
   * Prefix-sum of cumulative offsets: `offsets[i]` = total height of rows [0,i),
   * `offsets[len]` = totalHeight. Rebuilt on rows/measurement/estimate/expansion
   * change. O(n) rebuild; incremental isn't worth the complexity (one call site).
   */
  const offsets = computed(() => {
    // Touch the revision so measurement mutations invalidate this computed.
    void measureRevision.value
    const rows = rowsRef.value
    const prefix = new Array(rows.length + 1)
    prefix[0] = 0
    for (let index = 0; index < rows.length; index += 1) {
      prefix[index + 1] = prefix[index] + heightFor(rows[index])
    }
    return prefix
  })

  const totalHeight = computed(() => {
    const prefix = offsets.value
    return prefix[prefix.length - 1] || 0
  })

  /**
   * Largest index `i` such that `offsets[i] <= target`, via binary search over
   * the monotonically non-decreasing prefix-sum. Returns an index in
   * [0, rows.length]. Used to find the first row intersecting the viewport top.
   */
  const findIndexAtOffset = (prefix, target) => {
    let low = 0
    let high = prefix.length - 1
    if (target <= 0) return 0
    if (target >= prefix[high]) return Math.max(0, high - 1)
    while (low < high) {
      const mid = (low + high + 1) >>> 1
      if (prefix[mid] <= target) {
        low = mid
      } else {
        high = mid - 1
      }
    }
    return low
  }

  // Referential-stability memo (fix F2): return the SAME {start,end} object when
  // the visible boundaries didn't move, so `windowedRows` (and its row refs) is
  // not re-created. A fresh object every measure sustained the
  // measure→render→re-measure loop (the "Page Unresponsive" hang).
  let lastRange = { start: 0, end: 0 }
  const range = computed(() => {
    const rows = rowsRef.value
    const count = rows.length
    if (count === 0) {
      if (lastRange.start !== 0 || lastRange.end !== 0) lastRange = { start: 0, end: 0 }
      return lastRange
    }

    const prefix = offsets.value
    const top = readScrollTop()
    const height = readViewport()

    const firstVisible = findIndexAtOffset(prefix, top)
    // Last row that starts before the viewport bottom.
    const lastVisible = findIndexAtOffset(prefix, top + height)

    const start = Math.max(0, firstVisible - fixedOverscan)
    // +1 to make `end` exclusive and include the partially-visible last row,
    // then + overscan below.
    const end = Math.min(count, lastVisible + 1 + fixedOverscan)
    if (start === lastRange.start && end === lastRange.end) return lastRange
    lastRange = { start, end }
    return lastRange
  })

  const windowedRows = computed(() => {
    const rows = rowsRef.value
    const { start, end } = range.value
    const slice = []
    for (let index = start; index < end; index += 1) {
      const row = rows[index]
      slice.push({ row, key: keyOf(row), index })
    }
    return slice
  })

  const topSpacer = computed(() => {
    const prefix = offsets.value
    const { start } = range.value
    return prefix[start] || 0
  })

  const bottomSpacer = computed(() => {
    const prefix = offsets.value
    const { end } = range.value
    const total = prefix[prefix.length - 1] || 0
    return Math.max(0, total - (prefix[end] || 0))
  })

  /**
   * Record a measured height for a row identity. When the measurement lands on
   * a row ABOVE the current first-visible row (or changes an above-fold
   * expansion band), the accumulated delta is reported via `onAnchorAdjust` so
   * the host can nudge `scrollTop` and keep the viewport anchored (no jump).
   *
   * @param {(string|number)} key stable row identity (`row.id`)
   * @param {number} height measured pixel height (base row, or expansion band)
   * @param {{ expansion?: boolean }} [opts] `expansion:true` records the inline
   *   expansion band height instead of the base row height
   */
  const measureRow = (key, height, opts = {}) => {
    if (key === undefined || key === null) return
    // Round to an integer (fix F1): fractional getBoundingClientRect heights make
    // the `===` dedupe below miss under sub-pixel jitter (DPR/zoom/scrollbar), so
    // every measure was "accepted", re-arming the render loop. Sub-pixel precision
    // is invisible and scrollTop is integer-clamped by the browser.
    const next = Math.round(Number(height))
    if (!Number.isFinite(next) || next < 0) return

    const store = opts.expansion ? expansionHeights : baseHeights
    const previous = store.has(key) ? store.get(key) : opts.expansion ? 0 : readEstimate()
    if (previous === next) return

    // Index of the row being measured, BEFORE mutating, so the anchor decision
    // uses the pre-change layout. O(1) via the id→index map (fix F3) instead of
    // an O(n) rows.findIndex per measurement.
    const measuredIndex = keyToIndex.value.has(key) ? keyToIndex.value.get(key) : -1
    const scrollTopPx = readScrollTop()
    // The anchor only matters when scrolled: at the top there is no above-fold
    // row to keep anchored. Skipping the offsets read at scrollTop 0 avoids the
    // O(n) prefix-sum rebuild during the initial measurement burst.
    const anchorIndex = scrollTopPx > 0 ? findIndexAtOffset(offsets.value, scrollTopPx) : 0

    store.set(key, next)
    measureRevision.value += 1

    // Anchor: if the changed row sits strictly above the first visible row, the
    // content above the fold grew/shrank by `delta`; shift scrollTop to match.
    if (measuredIndex !== -1 && measuredIndex < anchorIndex) {
      onAnchorAdjust(next - previous)
    }
  }

  /**
   * Pixel offset of a row index from the top of the scroll content.
   * @param {number} index
   * @returns {number}
   */
  const offsetOf = (index) => {
    const prefix = offsets.value
    if (index <= 0) return 0
    if (index >= prefix.length) return prefix[prefix.length - 1] || 0
    return prefix[index]
  }

  /**
   * Resolve the scroll offset that brings a row identity to the viewport top.
   * Returns `null` when the key is not present (caller decides what to do).
   * The host is responsible for assigning the returned value to its container's
   * `scrollTop` — this composable owns no DOM.
   *
   * @param {(string|number)} key
   * @returns {number | null}
   */
  const scrollToKey = (key) => {
    const index = keyToIndex.value.has(key) ? keyToIndex.value.get(key) : -1
    if (index === -1) return null
    return offsetOf(index)
  }

  /**
   * Current total height for a row identity (base + expansion band when open),
   * falling back to the estimate for unmeasured rows.
   * @param {(string|number)} key
   * @returns {number}
   */
  const getRowHeight = (key) => {
    void measureRevision.value
    const index = keyToIndex.value.has(key) ? keyToIndex.value.get(key) : -1
    if (index !== -1) return heightFor(rowsRef.value[index])
    return baseHeights.has(key) ? baseHeights.get(key) : readEstimate()
  }

  /**
   * Drop all measured heights so every row falls back to the estimate and is
   * re-measured on next paint. Used at the end of a column resize (§12.2) and
   * internally on `resetToken` change.
   */
  const forceRemeasure = () => {
    if (baseHeights.size === 0 && expansionHeights.size === 0) return
    baseHeights.clear()
    expansionHeights.clear()
    measureRevision.value += 1
  }

  // Reset seam: a new query/filter/dataset bumps `resetToken` → clear caches so
  // stale heights from the previous result set never leak into the new one.
  // `append` (same result set, more rows) must NOT bump the token.
  watch(
    () => resolve(resetToken),
    () => forceRemeasure(),
    { flush: 'sync' }
  )

  // Reclaim measured heights for rows dropped by FIFO eviction (fix L2). Eviction
  // does NOT bump resetToken, so prune ids no longer present, guarded PER-MAP so a
  // fully-measured buffer with expanded rows (base+expansion > rows.length) does
  // not trigger a useless scan. Pruned ids are absent from rowsRef → no bump.
  watch(
    rowsRef,
    (rows) => {
      const pruneBase = baseHeights.size > rows.length
      const pruneExpansion = expansionHeights.size > rows.length
      if (!pruneBase && !pruneExpansion) return
      const live = new Set()
      for (const row of rows) live.add(keyOf(row))
      if (pruneBase)
        for (const key of baseHeights.keys()) if (!live.has(key)) baseHeights.delete(key)
      if (pruneExpansion)
        for (const key of expansionHeights.keys()) if (!live.has(key)) expansionHeights.delete(key)
    },
    { flush: 'post' }
  )

  return {
    windowedRows,
    topSpacer,
    bottomSpacer,
    totalHeight,
    measureRow,
    scrollToKey,
    forceRemeasure,
    getRowHeight,
    offsetOf
  }
}

/**
 * Read a value that may be a ref, a getter, or a plain value.
 * @template T
 * @param {import('vue').Ref<T> | (() => T) | T} source
 * @returns {T}
 */
function resolve(source) {
  if (typeof source === 'function') return source()
  return unref(source)
}
