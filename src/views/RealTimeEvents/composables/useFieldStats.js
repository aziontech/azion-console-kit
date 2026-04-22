import { computed } from 'vue'

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

  const fieldStats = computed(() => {
    const rows = data.value
    if (!rows?.length) return {}

    const counts = {}
    rows.forEach((row) => {
      if (!row?.summary || !Array.isArray(row.summary)) return
      row.summary.forEach(({ key, value }) => {
        if (!counts[key]) counts[key] = {}
        const strValue = String(value)
        if (strValue && strValue !== '-') {
          counts[key][strValue] = (counts[key][strValue] || 0) + 1
        }
      })
    })

    const result = {}
    for (const [field, valueCounts] of Object.entries(counts)) {
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
