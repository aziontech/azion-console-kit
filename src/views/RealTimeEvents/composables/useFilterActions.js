import { OPERATOR_MAPPING } from '@/components/base/advanced-filter-system/filterFields/filterRow/component'

/**
 * Composable for filter CRUD and URL hash synchronisation.
 *
 * Extracted from tab-panel-block.vue to keep the component thin.
 * Query history is persisted inside the shared AzionQueryLanguage component.
 *
 * @param {Object} options
 * @param {import('vue').Ref<Object>}  options.filterData       – shared reactive filter state
 * @param {import('vue').Ref<Array>}   options.filterFields      – available filter field definitions (from props)
 * @param {import('vue').ComputedRef<Object>} options.tabSelected – current tab/dataset config
 * @param {Array}                       options.initialFilters    – default filters injected by the panel
 * @param {Function}                    options.loadData          – triggers a full data reload
 * @param {import('vue').Ref<boolean>} options.initialLoadDone   – guards against premature reloads
 * @param {import('vue').Ref<boolean>} options.isLoading         – current loading state
 * @param {Function}                    options.onError           – error callback (replaces toast)
 * @param {Function}                    options.getFiltersFromHash – from useRouteFilterManager
 * @param {Function}                    options.setFilterInHash    – from useRouteFilterManager
 */
export function useFilterActions({
  filterData,
  filterFields,
  tabSelected,
  initialFilters,
  loadData,
  initialLoadDone,
  isLoading,
  onError,
  getFiltersFromHash,
  setFilterInHash
}) {
  // ── Default filter factory ──
  const defaultFilter = () => ({
    tsRange: {
      tsRangeBegin: new Date(Date.now() - 5 * 60 * 1000).toISOString().replace(/\.\d{3}/, ''),
      tsRangeEnd: new Date().toISOString().replace(/\.\d{3}/, ''),
      label: 'Last 5 minutes'
    },
    fields: [],
    dataset: ''
  })

  // ── Initialise / refresh filter data from URL hash ──
  const refreshFilterData = () => {
    const filter = getFiltersFromHash()
    filterData.value = defaultFilter()
    if (filter) {
      filterData.value = filter
      filterData.value.fields = filter.dataset === tabSelected.value?.dataset ? filter.fields : []
    }
    if (initialFilters?.length) {
      const existing = filterData.value.fields || []
      const keys = new Set(
        existing.map((filterField) => `${filterField.valueField}:${filterField.value}`)
      )
      filterData.value = {
        ...filterData.value,
        fields: [
          ...initialFilters.filter(
            (filterField) => !keys.has(`${filterField.valueField}:${filterField.value}`)
          ),
          ...existing
        ]
      }
    }
  }

  // ── Persist filters in URL hash + reload ──
  // Query history is persisted by AzionQueryLanguage.markAsApplied (shared across
  // Events and Metrics), so this composable only handles the hash + data reload.
  const reloadListTableWithHash = async () => {
    if (!initialLoadDone.value || isLoading.value) return
    await setFilterInHash({ ...filterData.value, dataset: tabSelected.value?.dataset })
    loadData()
  }

  // ── Filter CRUD ──
  const handleAddFilter = (fieldName, value) => {
    const match = filterFields.value.find((filterField) => filterField.value === fieldName)
    if (!match) {
      onError({
        closable: true,
        severity: 'warn',
        summary: `Field "${fieldName}" not available as filter`
      })
      return
    }
    const eqOp = match.operator.find((op) => op.value === 'Eq' || op.value === 'Like')
    if (!eqOp) return
    const stringValue = String(value)
    // Deduplicate: an identical (field, operator, value) triple is a no-op —
    // repeated legend clicks would otherwise stack filters like
    // `wafLearning = 1 AND wafLearning = 1` which is nonsense to the user.
    const alreadyApplied = filterData.value.fields.some(
      (entry) =>
        entry.valueField === fieldName &&
        entry.operator === eqOp.value &&
        String(entry.value) === stringValue
    )
    if (alreadyApplied) return
    filterData.value.fields = [
      ...filterData.value.fields,
      {
        field: match.label,
        valueField: fieldName,
        operator: eqOp.value,
        value: stringValue,
        type: eqOp.type || 'String'
      }
    ]
    reloadListTableWithHash()
  }

  // Adds a half-open numeric range filter: [gteValue, ltValue). Used by the
  // chart legend click-to-filter for status buckets (e.g. 2xx → 200..299).
  // Silently degrades when the field doesn't expose Gte/Lt operators.
  const handleAddRangeFilter = (fieldName, gteValue, ltValue) => {
    const match = filterFields.value.find((filterField) => filterField.value === fieldName)
    if (!match) {
      onError({
        closable: true,
        severity: 'warn',
        summary: `Field "${fieldName}" not available as filter`
      })
      return
    }
    const gteOp = match.operator.find((op) => op.value === 'Gte' || op.value === 'Ge')
    const ltOp = match.operator.find((op) => op.value === 'Lt' || op.value === 'Lte')
    if (!gteOp || !ltOp) {
      onError({
        closable: true,
        severity: 'warn',
        summary: `Range filter unavailable for "${fieldName}"`
      })
      return
    }
    filterData.value.fields = [
      ...filterData.value.fields,
      {
        field: match.label,
        valueField: fieldName,
        operator: gteOp.value,
        value: String(gteValue),
        type: gteOp.type || 'Int'
      },
      {
        field: match.label,
        valueField: fieldName,
        operator: ltOp.value,
        value: String(ltValue),
        type: ltOp.type || 'Int'
      }
    ]
    reloadListTableWithHash()
  }

  const handleExcludeFilter = (fieldName, value) => {
    const match = filterFields.value.find((filterField) => filterField.value === fieldName)
    if (!match) return
    const neOp = match.operator.find((op) => op.value === 'Ne' || op.value === 'Ilike')
    if (!neOp) return
    filterData.value.fields = [
      ...filterData.value.fields,
      {
        field: match.label,
        valueField: fieldName,
        operator: neOp.value,
        value: String(value),
        type: neOp.type || 'String'
      }
    ]
    reloadListTableWithHash()
  }

  const handleRemoveFilter = (index) => {
    filterData.value.fields.splice(index, 1)
    reloadListTableWithHash()
  }

  // ── Query history display helpers ──
  const getHistoryParts = (entry) => {
    if (entry.filterFields?.length) {
      return entry.filterFields.map((filterField) => ({
        field: filterField.field || filterField.valueField,
        operator: OPERATOR_MAPPING[filterField.operator]?.label || filterField.operator,
        value: String(filterField.value)
      }))
    }
    const operatorKeys = Object.keys(OPERATOR_MAPPING)
    return (entry.query || '').split(' AND ').map((seg) => {
      const trimmed = seg.trim()
      for (const key of operatorKeys) {
        const idx = trimmed.indexOf(` ${key} `)
        if (idx !== -1) {
          return {
            field: trimmed.substring(0, idx),
            operator: OPERATOR_MAPPING[key].label,
            value: trimmed.substring(idx + key.length + 2)
          }
        }
      }
      return { field: trimmed, operator: '', value: '' }
    })
  }

  return {
    defaultFilter,
    refreshFilterData,
    reloadListTableWithHash,
    handleAddFilter,
    handleAddRangeFilter,
    handleExcludeFilter,
    handleRemoveFilter,
    getHistoryParts
  }
}
