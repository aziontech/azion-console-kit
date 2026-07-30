import { ref, unref } from 'vue'
import { useKeepAliveResource } from '@/composables/useKeepAliveResource.js'

/**
 * `useOverflowMeasure` — ONE shared `ResizeObserver` for the whole table (design
 * §2.1(1), §3.2, §12.2, task 3.3). Replaces v1's per-row observer (the P1 leak)
 * with a single observer keyed by `row.id` so the count stays O(1); lifecycle
 * owned by `useKeepAliveResource`, owns no DOM (host feeds elements via observeRow).
 *
 * @param {Object} [options]
 * @param {import('vue').Ref<Element|null> | (() => Element|null)} [options.scrollParentRef]
 *   The table's scroll viewport element (or a getter/ref of it). Used to skip
 *   measurement when the table is not attached; measurement itself is per-row.
 * @returns {{
 *   hiddenCountFor: (rowKey: (string|number)) => number,
 *   observeRow: (rowKey: (string|number), el: Element|null) => void,
 *   unobserveRow: (rowKey: (string|number)) => void,
 *   measureAll: () => void,
 *   observedCount: () => number,
 *   isActive: import('vue').Ref<boolean>
 * }}
 */
// Sub-pixel slack when comparing a badge's bottom against the container's
// clipped bottom (v1 threshold). Never varied by the single caller (C5).
const TOLERANCE_PX = 0.5

export function useOverflowMeasure({ scrollParentRef = null } = {}) {
  // rowKey -> hidden badge count. A plain reactive ref of a Map is not deeply
  // reactive on Map mutation, so we swap identity via a version-free pattern:
  // store counts in a plain Map and expose reads through a bumping ref.
  const counts = new Map()
  const revision = ref(0)

  // rowKey -> observed element, and its inverse (element -> rowKey) so the
  // single observer's callback can resolve which row an entry belongs to.
  const elByKey = new Map()
  const keyByEl = new WeakMap()

  let observer = null
  let rafId = 0
  // Rows whose containers changed size since the last measurement flush; the
  // RAF batch measures only these, keeping work O(changed) not O(observed).
  const dirtyKeys = new Set()

  const resolveScrollParent = () => {
    if (!scrollParentRef) return null
    return (
      unref(typeof scrollParentRef === 'function' ? scrollParentRef() : scrollParentRef) ?? null
    )
  }

  /**
   * Count how many badges overflow the container's clipped bottom edge — the
   * "+N more" count. Mirrors the v1 per-row measure(): walk every badge that is
   * not the trailing "+N more" chip and compare its bottom to the container's
   * clipped bottom. Returns 0 for a detached/empty container.
   */
  const measureContainer = (container) => {
    if (!container || typeof container.getBoundingClientRect !== 'function') return 0
    const containerBottom = container.getBoundingClientRect().bottom
    let hidden = 0
    const badges = container.querySelectorAll('.log-badge:not(.log-badge--more)')
    badges.forEach((badge) => {
      const rect = badge.getBoundingClientRect()
      if (rect.bottom > containerBottom + TOLERANCE_PX) hidden += 1
    })
    return hidden
  }

  const setCount = (rowKey, next) => {
    const previous = counts.get(rowKey)
    if (previous === next) return
    counts.set(rowKey, next)
    revision.value += 1
  }

  /**
   * Measure the given set of row keys (defaults to all observed rows). While the
   * table is detached (no scroll parent in the DOM) measurement is skipped — the
   * next resize/observe pass re-measures once it is attached.
   */
  const measure = (keys) => {
    // If a scrollParentRef was supplied but resolves to null, the table is not
    // mounted; skip. When no scrollParentRef is supplied we always measure.
    if (scrollParentRef && !resolveScrollParent()) return
    const targets = keys && keys.size ? keys : elByKey.keys()
    for (const rowKey of targets) {
      const el = elByKey.get(rowKey)
      if (!el) continue
      setCount(rowKey, measureContainer(el))
    }
  }

  const scheduleMeasure = (keys) => {
    if (keys) {
      for (const key of keys) dirtyKeys.add(key)
    }
    if (rafId) return
    const runner = () => {
      rafId = 0
      const batch = new Set(dirtyKeys)
      dirtyKeys.clear()
      // Every dirty key was unobserved before the rAF fired: schedule nothing
      // (an empty batch must NOT fall back to a full re-measure — fix F1).
      if (!batch.size) return
      measure(batch)
    }
    if (typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(runner)
    } else {
      // SSR / non-DOM fallback: measure synchronously on next microtask.
      rafId = 1
      Promise.resolve().then(runner)
    }
  }

  const cancelScheduled = () => {
    if (!rafId) return
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId)
    rafId = 0
  }

  const onObserverEntries = (entries) => {
    const changed = new Set()
    for (const entry of entries) {
      const rowKey = keyByEl.get(entry.target)
      if (rowKey !== undefined) changed.add(rowKey)
    }
    if (changed.size) scheduleMeasure(changed)
  }

  // The SINGLE observer for the whole table. Created on mount/activate,
  // disconnected on unmount/deactivate (symmetric — no per-row observers, no
  // leak across keep-alive cycles).
  const { isActive } = useKeepAliveResource(
    () => {
      if (typeof ResizeObserver === 'undefined') return null
      observer = new ResizeObserver(onObserverEntries)
      // Re-observe every element registered before (or during) acquire so a
      // keep-alive re-activation restores the full watch set with one observer.
      for (const el of elByKey.values()) {
        if (el) observer.observe(el)
      }
      if (elByKey.size) scheduleMeasure(new Set(elByKey.keys()))
      return observer
    },
    (ro) => {
      cancelScheduled()
      dirtyKeys.clear()
      ro?.disconnect()
      observer = null
    }
  )

  /**
   * Register (or re-register) a row's badge container. Passing a new element for
   * an existing key swaps the observed element (recycled DOM node); passing null
   * unregisters the row. The SAME single observer watches every element.
   *
   * @param {(string|number)} rowKey stable row identity (`row.id`)
   * @param {Element|null} el the row's `.log-badges-container` element
   */
  const observeRow = (rowKey, el) => {
    if (rowKey === undefined || rowKey === null) return
    const previousEl = elByKey.get(rowKey)
    if (previousEl === el) return

    if (previousEl) {
      observer?.unobserve(previousEl)
      keyByEl.delete(previousEl)
    }

    if (!el) {
      elByKey.delete(rowKey)
      return
    }

    elByKey.set(rowKey, el)
    keyByEl.set(el, rowKey)
    observer?.observe(el)
    scheduleMeasure(new Set([rowKey]))
  }

  /**
   * Stop watching a row (recycled/removed). The observed element is unobserved
   * from the single observer; its last hidden count is dropped.
   * @param {(string|number)} rowKey
   */
  const unobserveRow = (rowKey) => {
    const el = elByKey.get(rowKey)
    if (el) {
      observer?.unobserve(el)
      keyByEl.delete(el)
    }
    elByKey.delete(rowKey)
    dirtyKeys.delete(rowKey)
    if (counts.delete(rowKey)) revision.value += 1
  }

  /**
   * The "+N more" count for a row, or 0 when unmeasured/unknown. Reactive: reads
   * touch `revision`, so a template using this recomputes when a count changes.
   * @param {(string|number)} rowKey
   * @returns {number}
   */
  const hiddenCountFor = (rowKey) => {
    void revision.value
    return counts.get(rowKey) || 0
  }

  /** Force a synchronous re-measure of every observed row (e.g. column resize). */
  const measureAll = () => {
    cancelScheduled()
    dirtyKeys.clear()
    measure(new Set(elByKey.keys()))
  }

  /** Number of rows currently observed by the single observer (test probe). */
  const observedCount = () => elByKey.size

  return {
    hiddenCountFor,
    observeRow,
    unobserveRow,
    measureAll,
    observedCount,
    isActive
  }
}
