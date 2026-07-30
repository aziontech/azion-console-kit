import { toRaw } from 'vue'
import { OPERATOR_MAPPING } from '@/components/base/advanced-filter-system-v2/filterFields/filterRow/component'

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
  onError,
  getFiltersFromHash,
  setFilterInHash
}) {
  // ── Default filter factory ──
  // Uses relative label so the AdvancedFilterSystem resolves the actual
  // timestamps at apply-time using the account timezone offset.
  // Fallback dates are set to now (UTC) so the date picker initialises
  // without Invalid Date; they are overwritten by applyFilters().
  const defaultFilter = () => {
    const now = new Date()
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
    return {
      tsRange: {
        tsRangeBegin: fiveMinAgo.toISOString().replace(/\.\d{3}/, ''),
        tsRangeEnd: now.toISOString().replace(/\.\d{3}/, ''),
        label: 'Last 5 minutes'
      },
      fields: [],
      dataset: ''
    }
  }

  // ── Initialise / refresh filter data from URL hash (one-way rehydrate) ──
  // This is the ONLY reader of the hash into the SoT, and only on init: it seeds
  // `filterData` (the SoT) from the URL once. After this, the hash is a
  // write-only projection driven by `syncHash()` — it is never read back into
  // `filterData`, so the two can't diverge (task 9.3, req 4.9/4.11).
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

  // ── Filter Single-Source-of-Truth → URL hash projection (task 9.3, req 4.9/4.11) ──
  //
  // `filterData` is the ONE writable source of truth for the active filter
  // (tsRange + fields + dataset). The URL hash is a DERIVED projection of it,
  // NOT a second independent source that could diverge: after the initial
  // rehydrate (`refreshFilterData` reads the hash once into `filterData`), the
  // hash is only ever WRITTEN from `filterData` and never read back into it.
  //
  // `syncHash()` is the SINGLE writer of that projection. Every filter mutation
  // funnels its hash write through here so there is exactly one place that
  // serializes the SoT into the URL. It enforces the two ordering invariants:
  //   1. `initialLoadDone` guard — no hash write (nor reload) before the first
  //      load has completed, so a premature write can't clobber the hash the
  //      panel is still rehydrating from.
  //   2. write-hash-before-load — the hash is updated to reflect the SoT
  //      BEFORE `loadData()` runs, so a shared/reloaded URL always matches the
  //      data being fetched.
  // Returns the pending `setFilterInHash` promise when the projection is being
  // written (guard passed), or `null` synchronously when the write is skipped
  // because the initial load has not completed yet. Callers `await` the returned
  // promise to preserve the write-hash-before-load ordering; the synchronous
  // `null` lets a caller short-circuit without an extra microtask hop.
  const syncHash = () => {
    if (!initialLoadDone.value) return null
    return setFilterInHash({ ...filterData.value, dataset: tabSelected.value?.dataset })
  }

  // ── Persist filters in URL hash + reload ──
  // Query history is persisted by AzionQueryLanguage.markAsApplied (shared across
  // Events and Metrics), so this composable only handles the hash projection +
  // data reload. The hash write goes through the single `syncHash()` writer,
  // preserving the initialLoadDone guard and the write-hash-before-load order
  // (exactly one awaited hash write before loadData, unchanged from before).
  const reloadListTableWithHash = async () => {
    const pending = syncHash()
    if (pending === null) return
    await pending
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

  // ── Remove a filter chip BY IDENTITY, immutably ──
  // FilterTagsDisplay renders a FILTERED + projected view of the raw
  // `filterData.fields`: any raw filter whose field/operator isn't in the
  // dataset catalogue (or is disabled) is dropped from the chip list. So the
  // rendered chip position does NOT map to the raw array position. To avoid the
  // C6/SR-4 desync (a hidden raw filter shifting the index and dropping the
  // WRONG chip), the base component emits the SOURCE raw filter object itself —
  // we drop exactly that one by reference instead of resolving a positional
  // index.
  //
  // Removal produces a NEW fields array (immutable, §4.9) and preserves the
  // relative order of every surviving chip; no in-place mutation of the base
  // component's array is performed, so the emit is never reordered.
  const handleRemoveFilter = (target) => {
    const fields = filterData.value?.fields
    if (!Array.isArray(fields)) return
    if (target === undefined || target === null) return
    // Compare through `toRaw`: the emitted `target` and the stored fields may be
    // Vue reactive proxies of the same underlying object, so a plain `!==`
    // reference check would wrongly report a mismatch.
    const rawTarget = toRaw(target)
    const next = fields.filter((filterField) => toRaw(filterField) !== rawTarget)
    // Nothing matched → no-op (avoids a needless reload/hash write on a stale
    // or already-removed reference).
    if (next.length === fields.length) return
    filterData.value = {
      ...filterData.value,
      fields: next
    }
    reloadListTableWithHash()
  }

  // ── Drop filters that don't exist in the current dataset ──
  // When the dataset changes (e.g. HTTP Request → Functions) the active
  // filters may reference fields that the new dataset doesn't expose (e.g.
  // `status`). The filter tags hide those chips, but the underlying
  // `filterData.fields` still carries them, so they leak into both the
  // encoded `filters=` URL param and the API request — which then fails.
  // Prune them against the current `filterFields` catalogue so the URL and
  // the request stay consistent with what the dataset actually supports.
  // Returns true when at least one filter was removed.
  const pruneIncompatibleFilters = () => {
    const fields = filterData.value?.fields
    if (!Array.isArray(fields) || fields.length === 0) return false
    const available = filterFields.value
    // Skip while the catalogue hasn't loaded yet — an empty catalogue would
    // wipe still-valid filters during the brief async load gap.
    if (!Array.isArray(available) || available.length === 0) return false
    const validValueFields = new Set(available.map((filterField) => filterField.value))
    const kept = fields.filter((filterField) => validValueFields.has(filterField.valueField))
    if (kept.length === fields.length) return false
    filterData.value = { ...filterData.value, fields: kept }
    return true
  }

  // ── Query history display helpers ──
  const getHistoryParts = (entry) => {
    if (entry.filterFields?.length) {
      return entry.filterFields.map((filterField) => {
        let displayValue = filterField.value
        if (Array.isArray(displayValue)) {
          displayValue = displayValue.map((item) => item?.label || item?.value || item).join(', ')
        }
        return {
          field: filterField.field || filterField.valueField,
          operator: OPERATOR_MAPPING[filterField.operator]?.label || filterField.operator,
          value: String(displayValue)
        }
      })
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
    syncHash,
    reloadListTableWithHash,
    handleAddFilter,
    handleAddRangeFilter,
    handleExcludeFilter,
    handleRemoveFilter,
    pruneIncompatibleFilters,
    getHistoryParts
  }
}
