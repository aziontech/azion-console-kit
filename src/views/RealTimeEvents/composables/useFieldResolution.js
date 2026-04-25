import { computed, watch, ref } from 'vue'
import { AGGREGATION_OPERATORS } from '@/services/real-time-events-service/_shared/aggregation-operators'

/**
 * Resolves the unified list of available field options by merging 4 sources
 * (filterFields, liveDatasetFields, selectedFields, tableData row keys) with
 * case-insensitive deduplication.
 *
 * Implements incremental field tracking: an internal Set of known field keys
 * is maintained so that on tableData growth only newly appended rows are
 * scanned for new keys.
 *
 * @param {Object} deps
 * @param {import('vue').Ref<Array>|import('vue').ComputedRef<Array>} deps.filterFields
 * @param {import('vue').Ref<Array>|import('vue').ComputedRef<Array>} deps.liveDatasetFields
 * @param {import('vue').Ref<Array>} deps.selectedFields
 * @param {import('vue').Ref<Array>} deps.tableData
 * @returns {{ availableFieldOptions: import('vue').ComputedRef<Array<{label:string,value:string}>> }}
 */
export function useFieldResolution({ filterFields, liveDatasetFields, selectedFields, tableData }) {
  // ── Incremental tracking for tableData row keys ──
  // We keep a running Set of lowercase keys discovered from tableData rows
  // and a Map of lowercase → preferred display name. On tableData growth we
  // only scan newly appended rows.
  const knownRowKeys = new Map() // lowercase → display name
  const scannedLength = ref(0)
  // Bump a version counter so the computed re-evaluates when we discover new
  // keys from incremental scans.
  const rowKeysVersion = ref(0)

  watch(
    tableData,
    (data) => {
      if (!Array.isArray(data)) return
      const len = data.length

      if (len < scannedLength.value) {
        // tableData was reset (e.g. new query) — clear and rescan
        knownRowKeys.clear()
        scannedLength.value = 0
      }

      if (len <= scannedLength.value) return

      let added = false
      for (let i = scannedLength.value; i < len; i++) {
        const row = data[i]
        const summary = Array.isArray(row?.summary)
          ? row.summary
          : Array.isArray(row?.data)
            ? row.data
            : []
        for (let j = 0; j < summary.length; j++) {
          const key = summary[j]?.key
          if (!key) continue
          const display = String(key)
          if (AGGREGATION_OPERATORS.has(display)) continue
          const lower = display.toLowerCase()
          if (!knownRowKeys.has(lower)) {
            knownRowKeys.set(lower, display)
            added = true
          }
        }
      }
      scannedLength.value = len
      if (added) rowKeysVersion.value++
    },
    { immediate: true }
  )

  const availableFieldOptions = computed(() => {
    // Touch the version counter so Vue tracks it as a dependency.
    // eslint-disable-next-line no-unused-expressions
    rowKeysVersion.value

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

    // Source 4: row-discovered keys (from incremental scan)
    // Row-discovered names win because they reflect what the backend actually
    // emits, including any casing drift vs the curated docs list.
    for (const [lower, display] of knownRowKeys) {
      add(display, /* preferred */ true)
    }

    return Array.from(byKey.values())
      .map((entry) => entry.display)
      .sort((left, right) => left.localeCompare(right))
      .map((field) => ({ label: field, value: field }))
  })

  return { availableFieldOptions }
}
