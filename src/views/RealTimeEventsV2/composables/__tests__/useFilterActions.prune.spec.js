import { describe, it, expect, vi } from 'vitest'
import { ref, computed } from 'vue'
import { useFilterActions } from '../useFilterActions.js'

/**
 * Regression: switching dataset (e.g. HTTP Request → Functions) must drop
 * filters whose field is not supported by the new dataset, so the stale
 * filter does not leak into the encoded `filters=` URL param or the API
 * request (which would otherwise error).
 */
const makeActions = ({ fields, filterFields, dataset }) => {
  const filterData = ref({
    tsRange: { tsRangeBegin: '2026-06-17T00:00:00Z', tsRangeEnd: '2026-06-17T01:00:00Z' },
    fields,
    dataset
  })
  const actions = useFilterActions({
    filterData,
    filterFields: computed(() => filterFields),
    tabSelected: computed(() => ({ dataset })),
    initialFilters: [],
    loadData: vi.fn(),
    initialLoadDone: ref(true),
    isLoading: ref(false),
    onError: vi.fn(),
    getFiltersFromHash: vi.fn(() => null),
    setFilterInHash: vi.fn()
  })
  return { filterData, actions }
}

describe('useFilterActions.pruneIncompatibleFilters', () => {
  it('removes filters whose field is absent from the new dataset', () => {
    const { filterData, actions } = makeActions({
      fields: [
        { field: 'Status', valueField: 'status', operator: 'Eq', value: '200', type: 'Int' },
        { field: 'Host', valueField: 'host', operator: 'Eq', value: 'a.com', type: 'String' }
      ],
      // Functions dataset exposes `host` but not `status`.
      filterFields: [{ value: 'host', label: 'Host', operator: [{ value: 'Eq' }] }],
      dataset: 'edgeFunctionsEvents'
    })

    const changed = actions.pruneIncompatibleFilters()

    expect(changed).toBe(true)
    expect(filterData.value.fields).toEqual([
      { field: 'Host', valueField: 'host', operator: 'Eq', value: 'a.com', type: 'String' }
    ])
  })

  it('keeps all filters when every field is supported', () => {
    const { filterData, actions } = makeActions({
      fields: [
        { field: 'Host', valueField: 'host', operator: 'Eq', value: 'a.com', type: 'String' }
      ],
      filterFields: [{ value: 'host', label: 'Host', operator: [{ value: 'Eq' }] }],
      dataset: 'httpEvents'
    })

    const changed = actions.pruneIncompatibleFilters()

    expect(changed).toBe(false)
    expect(filterData.value.fields).toHaveLength(1)
  })

  it('does not prune while the field catalogue has not loaded yet', () => {
    const { filterData, actions } = makeActions({
      fields: [
        { field: 'Status', valueField: 'status', operator: 'Eq', value: '200', type: 'Int' }
      ],
      filterFields: [],
      dataset: 'httpEvents'
    })

    const changed = actions.pruneIncompatibleFilters()

    expect(changed).toBe(false)
    expect(filterData.value.fields).toHaveLength(1)
  })
})
