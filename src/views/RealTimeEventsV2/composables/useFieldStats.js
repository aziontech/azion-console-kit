import { computed, ref, watch } from 'vue'
import { useKeepAliveResource } from '@/composables/useKeepAliveResource'
import { rowKey } from './utils/row-key'

const DEFAULT_PINNED_FIELDS = Object.freeze([
  'host',
  'requestMethod',
  'status',
  'requestUri',
  'requestTime'
])

/**
 * Max distinct values RETURNED per field in `topValues`; running counts stay
 * exact (total/uniqueCount), only the presented list is capped with an `other`
 * tail bucket so `total === Σ topK.count + other` (§3.5/§12.3, P5). 10 (was 50):
 * each top value is a rendered row, so K is direct DOM + recompute weight.
 */
export const TOP_K = 10

/** Values that never count toward a field (empty / placeholder cells). */
const IGNORED_VALUES = new Set(['', '-', 'null', 'undefined'])

const alphabeticalCompare = (left, right) => left.localeCompare(right)

/**
 * Derived state for the FieldSidebar (owns value-counting, search-filter, and
 * pinned/available partitioning). Counts are ID-KEYED and eviction-safe (per-field
 * `Map<value,count>` + per-row contributions by id; P5: total === Σ topK + other),
 * use a real `statsDirty` toggle (task 9.8), and clear on unmount + deactivate.
 *
 * @param {Object} params
 * @param {import('vue').Ref<Array>}   params.data
 * @param {import('vue').Ref<Array>}   params.availableFields
 * @param {import('vue').Ref<string>}  params.searchQuery
 * @param {import('vue').Ref<Array>}   params.selectedFields
 * @param {string[]} [params.pinnedFields] override for the default pinned list
 * @param {import('vue').Ref<number>} [params.resetToken] dataset resetToken; a
 *   bump (new query/filter/dataset) rebuilds counts from the current rows. The
 *   shrink heuristic stays as fallback for legacy/unit callers with no token.
 * @returns {{
 *   fieldStats:              import('vue').ComputedRef<Record<string, { total: number, uniqueCount: number, topValues: Array<{ value: string, count: number, percent: number }> }>>,
 *   filteredFields:          import('vue').ComputedRef<Array>,
 *   pinnedFields:            import('vue').ComputedRef<Array>,
 *   availableFieldsNonPinned:import('vue').ComputedRef<Array>,
 *   isFieldSelected:         (value: string) => boolean
 * }}
 */
export function useFieldStats({
  data,
  availableFields,
  searchQuery,
  selectedFields,
  pinnedFields: pinnedFieldsOverride,
  resetToken
}) {
  const pinnedList = pinnedFieldsOverride || DEFAULT_PINNED_FIELDS
  const pinnedFieldSet = new Set(pinnedList)

  // field → (value → count). Exact running counts (never capped).
  const runningCounts = new Map()
  // rowKey → Array<[field, value]> already counted for that row. Lets eviction
  // subtract a dropped row's exact contribution by identity.
  const rowContributions = new Map()
  // Set of row keys already ingested — makes append id-keyed (only new rows are
  // counted) and makes double-ingest a no-op under reorder/re-emit.
  const ingested = new Set()

  // Real dirty toggle (task 9.8): flipped on every mutation; read by the
  // `fieldStats` computed as a genuine reactive dependency. No monotonic bump.
  const statsDirty = ref(false)
  const markDirty = () => {
    statsDirty.value = !statsDirty.value
  }

  // Per-field version counter (fix C6): bumped on every count mutation of a
  // field so the `fieldStats` computed can memoize per field and only re-sum +
  // re-sort the fields whose counts actually changed on an append. Reset in
  // `clearCounts`. Paired with a `field -> { version, entry }` cache.
  const fieldVersions = new Map()
  const fieldStatsCache = new Map()
  const bumpFieldVersion = (field) => {
    fieldVersions.set(field, (fieldVersions.get(field) || 0) + 1)
  }

  const ensureField = (field) => {
    let byValue = runningCounts.get(field)
    if (!byValue) {
      byValue = new Map()
      runningCounts.set(field, byValue)
    }
    return byValue
  }

  const incrementValue = (field, strValue) => {
    const byValue = ensureField(field)
    byValue.set(strValue, (byValue.get(strValue) || 0) + 1)
    bumpFieldVersion(field)
  }

  const decrementValue = (field, strValue) => {
    const byValue = runningCounts.get(field)
    if (!byValue) return
    const next = (byValue.get(strValue) || 0) - 1
    if (next > 0) byValue.set(strValue, next)
    else byValue.delete(strValue)
    bumpFieldVersion(field)
    // NOTE: an empty map is retained (do not delete the field) — a field that
    // has appeared with only ignored values still surfaces as total:0 (parity
    // with the previous behavior). Fields never seen at all stay absent.
  }

  /** Counts a single row (idempotent by identity) and records its contribution. */
  const ingestRow = (row) => {
    const key = rowKey(row)
    if (ingested.has(key)) return
    const summary = row?.summary
    if (!Array.isArray(summary)) {
      // Still mark as seen so it is not re-processed; no contribution.
      ingested.add(key)
      return
    }
    const contribution = []
    for (const entry of summary) {
      if (!entry) continue
      const { key: field, value } = entry
      if (field == null) continue
      // Register the field even when the value is ignored, so a field that only
      // ever carries placeholder values still reports total:0 (behavior parity).
      ensureField(field)
      const strValue = String(value)
      if (IGNORED_VALUES.has(strValue)) continue
      incrementValue(field, strValue)
      contribution.push([field, strValue])
    }
    ingested.add(key)
    rowContributions.set(key, contribution)
  }

  /** Removes a single row's contribution (used on FIFO eviction). */
  const removeRow = (row) => {
    const key = rowKey(row)
    if (!ingested.has(key)) return
    const contribution = rowContributions.get(key)
    if (contribution) {
      for (const [field, strValue] of contribution) decrementValue(field, strValue)
    }
    rowContributions.delete(key)
    ingested.delete(key)
  }

  const clearCounts = () => {
    runningCounts.clear()
    rowContributions.clear()
    ingested.clear()
    fieldVersions.clear()
    fieldStatsCache.clear()
  }

  // Rebuilds counts from a full row set (new query / shrink). Idempotent.
  const rebuildFrom = (rows) => {
    clearCounts()
    if (Array.isArray(rows)) {
      for (const row of rows) ingestRow(row)
    }
    markDirty()
  }

  // Ingest driven by the row set. Append (loadMore) counts only the not-yet-seen
  // rows (id-keyed, not a positional window); a shrink or clear rebuilds. This
  // survives eviction/reorder because membership is by identity, not slot.
  watch(
    () => data.value?.length,
    () => {
      const rows = data.value
      if (!rows?.length) {
        clearCounts()
        markDirty()
        return
      }
      // A shrink means the buffer no longer holds every previously-seen row.
      // Rather than diff, rebuild from the current set (correct under reorder
      // and new-query alike); append just ingests the new identities.
      if (rows.length < ingested.size) {
        rebuildFrom(rows)
        return
      }
      let changed = false
      for (const row of rows) {
        if (!ingested.has(rowKey(row))) {
          ingestRow(row)
          changed = true
        }
      }
      if (changed) markDirty()
    },
    { immediate: true }
  )

  // A `resetToken` bump ("new query/filter/dataset") rebuilds from the current
  // rows. Catches same-length replacements the length-watch shrink heuristic
  // misses. The heuristic stays as fallback for callers with no token wired.
  if (resetToken) {
    watch(resetToken, () => rebuildFrom(data.value))
  }

  /**
   * Subtracts an evicted batch's contributions by identity so totals stay exact
   * under FIFO eviction. Wire as `useEventDataset({ onEvict })` when eviction is
   * enabled. Safe no-op for unknown rows.
   *
   * @param {Array} droppedRows rows removed from the front of the buffer
   */
  const onEvict = (droppedRows) => {
    if (!Array.isArray(droppedRows) || droppedRows.length === 0) return
    for (const row of droppedRows) removeRow(row)
    markDirty()
  }

  const fieldStats = computed(() => {
    // Genuine reactive dependency (replaces the old version-ref no-op touch).
    void statsDirty.value

    if (runningCounts.size === 0) return {}

    const result = {}
    for (const [field, byValue] of runningCounts.entries()) {
      // Per-field memo (fix C6): reuse the cached entry when this field's counts
      // did not change since the last computation, so an append only re-sums +
      // re-sorts the fields that actually changed. Recompute path below is
      // byte-identical to the un-memoized output.
      const version = fieldVersions.get(field) || 0
      const cached = fieldStatsCache.get(field)
      if (cached && cached.version === version) {
        result[field] = cached.entry
        continue
      }

      let total = 0
      for (const count of byValue.values()) total += count

      const sorted = [...byValue.entries()].sort((entrA, entrB) => entrB[1] - entrA[1])
      const topEntries = sorted.slice(0, TOP_K)
      let topSum = 0
      const topValues = topEntries.map(([val, count]) => {
        topSum += count
        return {
          value: val,
          count,
          percent: total > 0 ? Math.round((count / total) * 100) : 0
        }
      })
      const other = total - topSum

      const entry = {
        total,
        uniqueCount: byValue.size,
        topValues,
        // Tail sum kept EXACT: total === Σ topValues.count + other (P5).
        other
      }
      fieldStatsCache.set(field, { version, entry })
      result[field] = entry
    }
    return result
  })

  const filteredFields = computed(() => {
    const query = (searchQuery.value || '').toLowerCase()
    return (availableFields.value || []).filter(
      (field) => !query || field.value.toLowerCase().includes(query)
    )
  })

  const pinnedFields = computed(() => {
    const set = new Set(filteredFields.value.map((field) => field.value))
    return [...pinnedList]
      .sort(alphabeticalCompare)
      .filter((name) => set.has(name))
      .map((name) => filteredFields.value.find((field) => field.value === name))
      .filter(Boolean)
  })

  const availableFieldsNonPinned = computed(() =>
    [...filteredFields.value]
      .filter((field) => !pinnedFieldSet.has(field.value))
      .sort((left, right) => {
        const leftHasStats = !!fieldStats.value[left.value]
        const rightHasStats = !!fieldStats.value[right.value]
        if (leftHasStats !== rightHasStats) return leftHasStats ? -1 : 1
        return alphabeticalCompare(left.value, right.value)
      })
  )

  const selectedFieldSet = computed(() => new Set(selectedFields.value || []))
  const isFieldSelected = (fieldValue) => selectedFieldSet.value.has(fieldValue)

  // Release/rehydrate the (potentially large) count maps through a SINGLE
  // keep-alive owner (task 9.9, req 4.6; no-leak invariant). Release (deactivate/
  // unmount) drops the derived maps; rehydrate (activate/mount) rebuilds them from
  // the current rows (the length-watch wouldn't re-fire on an unchanged buffer).
  const releaseStats = () => {
    clearCounts()
    markDirty()
  }
  const rehydrateStats = () => {
    rebuildFrom(data.value)
  }
  useKeepAliveResource(rehydrateStats, releaseStats)

  return {
    fieldStats,
    filteredFields,
    pinnedFields,
    availableFieldsNonPinned,
    isFieldSelected,
    onEvict
  }
}
