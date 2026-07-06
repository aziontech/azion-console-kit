import { shallowRef, watch } from 'vue'

/**
 * Buffer ceiling for the retained row set: `max(10 × pageSize, 5000)`, mirroring
 * the count/export `limit: 10000` (design §3.4/§7.4). Eviction is enabled in
 * Fase 4 (task 9.2) once search/stats are id-keyed; render invariants come from
 * windowing, not eviction.
 */
export const DEFAULT_MAX_ROWS = 5000
export const computeMaxRows = (pageSize) => Math.max(10 * (pageSize || 0), DEFAULT_MAX_ROWS)

const EMPTY_SUMMARY_MAP = Object.freeze(new Map())

/**
 * Builds a `Map<fieldKey, value>` from a row's `summary` array
 * (`[{ key, value }, ...]`) so cell reads are O(1) instead of O(fields) per
 * lookup. Rows without a summary array map to an empty (shared) map.
 */
const buildSummaryMap = (row) => {
  const summary = row?.summary
  if (!Array.isArray(summary) || summary.length === 0) return EMPTY_SUMMARY_MAP
  const map = new Map()
  for (const entry of summary) {
    if (entry && entry.key != null) map.set(entry.key, entry.value)
  }
  return map
}

/**
 * `useEventDataset` — THE TABLE DATA CONTRACT (design §2.1, §3.4, §7.4). The
 * single seam between the events producer and the table: takes the producer's
 * `rows` shallowRef (DIP) and layers on id-keyed lookups (`indexOfId`,
 * `summaryMapOf`), a monotonic `resetToken`, and the FIFO `maxRows` ceiling.
 *
 * @param {Object} params
 * @param {import('vue').ShallowRef<Array>} params.rows
 *   The producer's row buffer (e.g. `useEventsData().tableData`). Re-exposed
 *   verbatim so the table binds once; mutated only by the producer.
 * @param {import('vue').Ref<boolean>} [params.hasMore]
 *   The producer's "more pages available" flag; re-exposed as-is (single
 *   source). Defaults to a private `shallowRef(false)` when omitted.
 * @param {number} [params.pageSize=0]
 *   Used to size the buffer ceiling (`max(10×pageSize, 5000)`).
 * @param {boolean} [params.evictionEnabled=false]
 *   GATED OFF in Fase 1. When false, `evict()` is a no-op and the buffer grows
 *   as before (no regression). Fase 4 flips this on.
 * @param {(droppedRows: object[]) => void} [params.onEvict]
 *   Called after a FIFO eviction with the rows dropped from the front (oldest
 *   first). Lets id-keyed derivations (e.g. field stats) subtract the evicted
 *   rows' contributions by identity, keeping their totals exact under eviction.
 * @returns {{
 *   rows: import('vue').ShallowRef<Array>,
 *   hasMore: import('vue').Ref<boolean>,
 *   maxRows: number,
 *   evictionEnabled: boolean,
 *   resetToken: import('vue').ShallowRef<number>,
 *   indexOfId: (id: (string|number)) => number,
 *   hasId: (id: (string|number)) => boolean,
 *   rowById: (id: (string|number)) => (object|undefined),
 *   summaryMapOf: (id: (string|number)) => Map<string, any>,
 *   fieldValueOf: (id: (string|number), fieldKey: string) => any,
 *   evict: () => void,
 *   reset: () => void,
 *   releaseReclaimable: () => void,
 *   rehydrate: () => void
 * }}
 */
export function useEventDataset({
  rows: injectedRows,
  hasMore: injectedHasMore,
  pageSize = 0,
  evictionEnabled = false,
  onEvict
} = {}) {
  const rows = injectedRows || shallowRef([])
  const hasMore = injectedHasMore || shallowRef(false)
  const maxRows = computeMaxRows(pageSize)

  // A single monotonic reset signal. Consumers (window/search/stats/selection)
  // watch this to clear id-keyed caches when the producer swaps in a fresh set.
  const resetToken = shallowRef(0)

  // id → position in `rows.value` (O(1) index lookup).
  const idIndex = new Map()
  // id → Map<fieldKey, value> (O(1) cell access), built lazily on ingest.
  const summaryIndex = new Map()

  /**
   * Full rebuild of both id-keyed indexes from the current buffer. O(n) over
   * `current`. Used for resets, shrinks, and the immediate first pass; append
   * growth uses the incremental path below instead.
   */
  const reindex = (current) => {
    idIndex.clear()
    summaryIndex.clear()
    if (!Array.isArray(current)) return
    for (let position = 0; position < current.length; position++) {
      indexRowAt(current[position], position)
    }
  }

  /** Indexes a single row at a known position (id → position, id → summaryMap). */
  function indexRowAt(row, position) {
    const id = row?.id
    if (id == null) return
    idIndex.set(id, position)
    summaryIndex.set(id, buildSummaryMap(row))
  }

  /**
   * Incremental index maintenance for an append (loadMore): only the rows in
   * `[from, current.length)` are indexed; existing entries keep their positions
   * (an append never shifts earlier rows). O(appended), not O(n).
   */
  const indexAppended = (current, from) => {
    for (let position = from; position < current.length; position++) {
      indexRowAt(current[position], position)
    }
  }

  let previousLength = 0
  // Set while `evict()` reassigns `rows.value` so the ensuing watch pass knows
  // the shrink is eviction (NOT a new query) — it must not bump `resetToken`
  // nor re-scan (evict already maintained the indexes). Design §7.4: eviction
  // ≠ new query; consumers must not clear their id-keyed caches on eviction.
  let evicting = false

  /**
   * FIFO eviction down to the ceiling (no-op when `evictionEnabled` is false).
   * The `evicting` guard stops the `rows` watch from reading the shrink as a new
   * query (which would wipe id-keyed caches — design §7.4); eviction maintains
   * the indexes itself and `onEvict(dropped)` lets consumers subtract by identity.
   */
  const evict = () => {
    if (!evictionEnabled) return
    const current = rows.value
    if (!Array.isArray(current) || current.length <= maxRows) return
    const dropped = current.slice(0, current.length - maxRows)
    const trimmed = current.slice(current.length - maxRows)
    evicting = true
    try {
      rows.value = trimmed
      // Incremental reindex (fix C2): survivors keep their summaryMap (same row
      // objects → identical content); only the evicted ids' entries are dropped.
      // Positions shifted, so id→position must be rebuilt. Equivalent final state
      // to reindex(trimmed), without re-allocating a Map per survivor per append.
      for (const row of dropped) {
        const id = row?.id
        if (id != null) summaryIndex.delete(id)
      }
      idIndex.clear()
      for (let position = 0; position < trimmed.length; position++) {
        const id = trimmed[position]?.id
        if (id != null) idIndex.set(id, position)
      }
      previousLength = trimmed.length
    } finally {
      evicting = false
    }
    if (typeof onEvict === 'function') onEvict(dropped)
  }

  // Keep the indexes in lock-step with the producer's buffer: GROWTH (append)
  // incrementally indexes the new tail then gated-evicts (no reset bump); SHRINK
  // (new query/filter/dataset) full-rebuilds + bumps `resetToken`; eviction-driven
  // shrink is skipped here (guarded by `evicting`) so it never reads as new query.
  watch(
    rows,
    (current) => {
      if (evicting) {
        previousLength = Array.isArray(current) ? current.length : 0
        return
      }
      const currentLength = Array.isArray(current) ? current.length : 0
      if (currentLength > previousLength) {
        // Append. If the id-index is out of sync (e.g. an in-place replacement
        // that also grew), fall back to a full rebuild; otherwise index only
        // the new tail.
        if (previousLength === idIndex.size) indexAppended(current, previousLength)
        else reindex(current)
        previousLength = currentLength
        evict()
        return
      }
      reindex(current)
      if (currentLength < previousLength) resetToken.value++
      previousLength = currentLength
    },
    { immediate: true }
  )

  /** O(1) index of a row by id, or -1 when absent. */
  const indexOfId = (id) => {
    const position = idIndex.get(id)
    return position === undefined ? -1 : position
  }

  const hasId = (id) => idIndex.has(id)

  /** The row object for an id, or undefined. */
  const rowById = (id) => {
    const position = idIndex.get(id)
    return position === undefined ? undefined : rows.value[position]
  }

  /** O(1) `Map<fieldKey, value>` for a row's summary; empty map when unknown. */
  const summaryMapOf = (id) => summaryIndex.get(id) || EMPTY_SUMMARY_MAP

  /**
   * O(1) single-cell value for `(id, fieldKey)`. Returns the raw stored value
   * (or undefined). `fieldKey` is the bare field name (no `field_` prefix).
   */
  const fieldValueOf = (id, fieldKey) => summaryMapOf(id).get(fieldKey)

  /**
   * Clears the buffer and bumps the reset token. Producers that don't clear
   * `rows` themselves can call this to signal a fresh query explicitly.
   */
  const reset = () => {
    rows.value = []
    reindex([])
    previousLength = 0
    resetToken.value++
  }

  /**
   * Releases the derived id-keyed indexes (rebuildable via `reindex`) without
   * touching the retained `rows` buffer, so an inactive keep-alive tab holds
   * nothing heavy yet reactivation rebuilds cheaply (no re-fetch; task 9.9, req
   * 4.6). Idempotent; does NOT bump `resetToken` (a memory reclaim, not a query).
   */
  const releaseReclaimable = () => {
    idIndex.clear()
    summaryIndex.clear()
  }

  /**
   * Rebuilds the reclaimable indexes from the current buffer (task 9.9, req 4.6),
   * paired with `releaseReclaimable` under the single keep-alive owner. Keeps
   * `previousLength` in lock-step so the `rows` watch doesn't misread the rebuild
   * as an append/shrink. Idempotent.
   */
  const rehydrate = () => {
    const current = rows.value
    reindex(current)
    previousLength = Array.isArray(current) ? current.length : 0
  }

  return {
    rows,
    hasMore,
    maxRows,
    evictionEnabled,
    resetToken,
    indexOfId,
    hasId,
    rowById,
    summaryMapOf,
    fieldValueOf,
    evict,
    reset,
    releaseReclaimable,
    rehydrate
  }
}
