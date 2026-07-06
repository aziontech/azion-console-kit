import { computed, watch, ref, shallowRef } from 'vue'
import { AGGREGATION_OPERATORS } from '@/services/real-time-events-service-v2/_shared/aggregation-operators'

/**
 * Resolves the unified list of available field options by merging 4 sources
 * (filterFields, liveDatasetFields, selectedFields, tableData row keys) with
 * case-insensitive dedup. Incremental: only newly appended rows are scanned for
 * new keys on tableData growth.
 *
 * @param {Object} deps
 * @param {import('vue').Ref<Array>|import('vue').ComputedRef<Array>} deps.filterFields
 * @param {import('vue').Ref<Array>|import('vue').ComputedRef<Array>} deps.liveDatasetFields
 * @param {import('vue').Ref<Array>} deps.selectedFields
 * @param {import('vue').Ref<Array>} deps.tableData
 * @param {import('vue').Ref<number>} [deps.resetToken] dataset resetToken; a bump
 *   (new query/filter/dataset) drops the discovered keys and forces a full
 *   rescan. A plain length shrink (FIFO eviction) does NOT reset.
 * @returns {{ availableFieldOptions: import('vue').ComputedRef<Array<{label:string,value:string}>> }}
 */
export function useFieldResolution({
  filterFields,
  liveDatasetFields,
  selectedFields,
  tableData,
  resetToken
}) {
  // ── Incremental tracking for tableData row keys ──
  // Discovered display names (lowercase → display) live in a `shallowRef` Map;
  // discovery reassigns `.value` so `availableFieldOptions` tracks it via a
  // GENUINE reactive read (no version-counter touch; task 9.8, req 4.8).
  const knownRowKeys = shallowRef(new Map()) // lowercase → display name
  const scannedLength = ref(0)

  /**
   * Scans rows in `[scannedLength, data.length)` for new field keys and advances
   * the cursor. Shared by the tableData watch (append growth) and the resetToken
   * watch (full rescan after a reset). Reassigns `knownRowKeys` only when a new
   * key landed so the computed re-runs on a real dependency change.
   */
  const scanNewRows = (data) => {
    if (!Array.isArray(data)) return
    const len = data.length
    if (len <= scannedLength.value) return

    const discovered = new Map(knownRowKeys.value)
    let added = false
    for (let idx = scannedLength.value; idx < len; idx++) {
      const row = data[idx]
      const summary = Array.isArray(row?.summary)
        ? row.summary
        : Array.isArray(row?.data)
          ? row.data
          : []
      for (let jdx = 0; jdx < summary.length; jdx++) {
        const key = summary[jdx]?.key
        if (!key) continue
        const display = String(key)
        if (AGGREGATION_OPERATORS.has(display)) continue
        const lower = display.toLowerCase()
        if (!discovered.has(lower)) {
          discovered.set(lower, display)
          added = true
        }
      }
    }
    scannedLength.value = len
    if (added) knownRowKeys.value = discovered
  }

  watch(
    tableData,
    (data) => {
      if (!Array.isArray(data)) return
      const len = data.length

      if (len < scannedLength.value) {
        if (resetToken) {
          // Wired path: a shrink is FIFO eviction, NOT a new query (a real reset
          // is signalled by `resetToken` below). Field names are fixed after page
          // 1, so keep `knownRowKeys` and just clamp the cursor (no O(buffer)
          // rescan on every loadMore past the cap).
          scannedLength.value = len
        } else {
          // Fallback path (no resetToken wired — legacy/unit callers): keep the
          // original heuristic where a shrink reads as a NEW QUERY, dropping the
          // discovered keys and rescanning from 0 so nothing regresses.
          knownRowKeys.value = new Map()
          scannedLength.value = 0
        }
      }

      scanNewRows(data)
    },
    { immediate: true }
  )

  // A `resetToken` bump ("new query/filter/dataset") drops the discovered keys
  // and rescans the current buffer. The rescan matters: the tableData watch may
  // run first in the same flush (clamping the cursor, scanning nothing), so
  // without it the new query's rows stay undiscovered. Eviction (above) does not.
  if (resetToken) {
    watch(resetToken, () => {
      knownRowKeys.value = new Map()
      scannedLength.value = 0
      scanNewRows(tableData.value)
    })
  }

  const availableFieldOptions = computed(() => {
    const byKey = new Map() // lowercase → { display, preferred }

    const add = (value, preferred = false) => {
      if (!value) return
      const display = String(value)
      if (AGGREGATION_OPERATORS.has(display)) return
      const lower = display.toLowerCase()
      const existing = byKey.get(lower)
      if (!existing || (preferred && !existing.preferred)) {
        byKey.set(lower, { display, preferred })
      }
    }

    // Source 1: filter fields
    const ff = filterFields.value || filterFields || []
    const filterArr = Array.isArray(ff) ? ff : []
    filterArr.forEach((field) => add(field?.value))

    // Source 2: live dataset fields
    const ldf = liveDatasetFields.value || liveDatasetFields || []
    const liveArr = Array.isArray(ldf) ? ldf : []
    liveArr.forEach((field) => add(field))

    // Source 3: selected fields
    const sf = selectedFields.value || selectedFields || []
    const selArr = Array.isArray(sf) ? sf : []
    selArr.forEach((field) => add(field))

    // Source 4: row-discovered keys (from incremental scan). These win because
    // they reflect what the backend actually emits, incl. casing drift vs the
    // curated docs list. Reading `.value` is the genuine reactive dependency that
    // re-runs this computed when discovery reassigns the map (task 9.8).
    for (const display of knownRowKeys.value.values()) {
      add(display, /* preferred */ true)
    }

    return Array.from(byKey.values())
      .map((entry) => entry.display)
      .sort((left, right) => left.localeCompare(right))
      .map((field) => ({ label: field, value: field }))
  })

  return { availableFieldOptions }
}
