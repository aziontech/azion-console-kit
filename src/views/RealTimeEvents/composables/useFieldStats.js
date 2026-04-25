import { computed, ref, watch } from 'vue'

const DEFAULT_PINNED_FIELDS = Object.freeze([
  'host',
  'requestMethod',
  'status',
  'requestUri',
  'requestTime'
])

const alphabeticalCompare = (left, right) => left.localeCompare(right)

/**
 * Derived state for the FieldSidebar. Keeps the component purely presentational
 * by owning the value-counting, search-filter, and pinned/available partition
 * computations.
 *
 * Inputs are passed as refs/computed so the composable stays reactive. Outputs
 * are read-only computed refs plus a membership predicate for selection.
 *
 * @param {Object} params
 * @param {import('vue').Ref<Array>}   params.data
 * @param {import('vue').Ref<Array>}   params.availableFields
 * @param {import('vue').Ref<string>}  params.searchQuery
 * @param {import('vue').Ref<Array>}   params.selectedFields
 * @param {string[]} [params.pinnedFields] override for the default pinned list
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
  pinnedFields: pinnedFieldsOverride
}) {
  const pinnedList = pinnedFieldsOverride || DEFAULT_PINNED_FIELDS
  const pinnedFieldSet = new Set(pinnedList)

  // ── Incremental field stats ──
  // Running counts map: field → value → count
  // On tableData growth (loadMore), only newly appended rows are processed.
  // On tableData shrink (new query), a full rebuild is performed.
  const runningCounts = {}
  let prevLength = 0
  const statsVersion = ref(0)

  watch(
    data,
    (rows) => {
      if (!rows?.length) {
        // Data cleared — reset everything
        for (const key of Object.keys(runningCounts)) delete runningCounts[key]
        prevLength = 0
        statsVersion.value++
        return
      }

      const currentLength = rows.length

      if (currentLength < prevLength) {
        // Data shrunk (new query) — full rebuild
        for (const key of Object.keys(runningCounts)) delete runningCounts[key]
        prevLength = 0
      }

      if (currentLength > prevLength) {
        // Process only new rows
        for (let i = prevLength; i < currentLength; i++) {
          const row = rows[i]
          if (!row?.summary || !Array.isArray(row.summary)) continue
          row.summary.forEach(({ key, value }) => {
            if (!runningCounts[key]) runningCounts[key] = {}
            const strValue = String(value)
            if (strValue && strValue !== '-') {
              runningCounts[key][strValue] = (runningCounts[key][strValue] || 0) + 1
            }
          })
        }
        prevLength = currentLength
        statsVersion.value++
      }
    },
    { immediate: true }
  )

  const fieldStats = computed(() => {
    // Touch version counter so Vue tracks it as a dependency
    // eslint-disable-next-line no-unused-expressions
    statsVersion.value

    if (!Object.keys(runningCounts).length) return {}

    const result = {}
    for (const [field, valueCounts] of Object.entries(runningCounts)) {
      const entries = Object.entries(valueCounts)
        .sort((entrA, entrB) => entrB[1] - entrA[1])
        .slice(0, 5)
      const total = Object.values(valueCounts).reduce((sum, count) => sum + count, 0)
      result[field] = {
        total,
        uniqueCount: Object.keys(valueCounts).length,
        topValues: entries.map(([val, count]) => ({
          value: val,
          count,
          percent: Math.round((count / total) * 100)
        }))
      }
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

  return {
    fieldStats,
    filteredFields,
    pinnedFields,
    availableFieldsNonPinned,
    isFieldSelected
  }
}
