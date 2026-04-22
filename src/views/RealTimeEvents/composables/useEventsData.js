import { ref } from 'vue'

const MAX_LIST_RANGE_MS = 2 * 60 * 60 * 1000 // 2 hours

/**
 * Composable for loading event data with temporal windowing for long ranges.
 * Handles initial load, pagination (load more), and chart aggregation.
 */
export function useEventsData({
  filterData,
  listService,
  loadChartAggregation,
  tabSelected,
  pageSize,
  hasChartConfig,
  toast,
  stackByField = null
}) {
  const tableData = ref([])
  const chartData = ref([])
  const kpis = ref(null)
  const recordsFound = ref(0)
  const isLoading = ref(false)
  const isChartLoading = ref(false)
  const hasMoreData = ref(false)
  const isLoadingMore = ref(false)
  const initialLoadDone = ref(false)

  // Internal pagination state
  let currentWindowEnd = null
  let currentOffset = 0
  let isShortRange = false
  let loadCallId = 0

  const getListFilter = (windowEnd) => {
    const filter = filterData.value
    if (!filter?.tsRange?.tsRangeBegin || !filter?.tsRange?.tsRangeEnd) return filter
    const begin = new Date(filter.tsRange.tsRangeBegin).getTime()
    const end = new Date(filter.tsRange.tsRangeEnd).getTime()
    if (end - begin <= MAX_LIST_RANGE_MS) return filter
    const wEnd = windowEnd || end
    const wBegin = Math.max(wEnd - MAX_LIST_RANGE_MS, begin)
    return {
      ...filter,
      tsRange: {
        ...filter.tsRange,
        tsRangeBegin: new Date(wBegin).toISOString(),
        tsRangeEnd: new Date(wEnd).toISOString()
      }
    }
  }

  // Coerce a filter value to its declared GraphQL scalar type. Without this
  // the query builder's typeof inference sees every value as `String` and the
  // API rejects numeric fields (e.g. `statusEq` expects `Int`).
  const coerceFilterValue = (rawValue, type) => {
    const normalizedType = String(type || '').toLowerCase()
    if (Array.isArray(rawValue)) {
      return rawValue.map((itemValue) =>
        coerceFilterValue(itemValue?.value !== undefined ? itemValue.value : itemValue, type)
      )
    }
    if (normalizedType === 'int') {
      const numberValue = parseInt(rawValue, 10)
      return Number.isFinite(numberValue) ? numberValue : rawValue
    }
    if (normalizedType === 'float' || normalizedType === 'number') {
      const numberValue = parseFloat(rawValue)
      return Number.isFinite(numberValue) ? numberValue : rawValue
    }
    if (normalizedType === 'boolean' || normalizedType === 'bool') {
      if (rawValue === true || rawValue === false) return rawValue
      const normalizedValue = String(rawValue).toLowerCase()
      if (normalizedValue === 'true') return true
      if (normalizedValue === 'false') return false
      return rawValue
    }
    return rawValue
  }

  const buildApiFilters = () => {
    const filters = {}
    if (filterData.value?.fields?.length) {
      filterData.value.fields.forEach((filterField) => {
        const value = coerceFilterValue(filterField.value, filterField.type)
        if (filterField.operator === 'In') {
          filters.in = filters.in || {}
          filters.in[filterField.valueField] = value
        } else {
          filters.and = filters.and || {}
          filters.and[`${filterField.valueField}${filterField.operator}`] = value
        }
      })
    }
    return filters
  }

  const resolveStackField = () => {
    if (!stackByField) return null
    const raw =
      typeof stackByField === 'object' && 'value' in stackByField
        ? stackByField.value
        : stackByField
    if (!raw || raw === 'none') return null
    return String(raw)
  }

  const loadChart = () => {
    if (!hasChartConfig.value || !loadChartAggregation.value) {
      isChartLoading.value = false
      return
    }
    isChartLoading.value = true
    loadChartAggregation
      .value({
        dataset: tabSelected.value?.dataset,
        tsRange: filterData.value?.tsRange,
        filters: buildApiFilters(),
        groupByField: resolveStackField()
      })
      .then((result) => {
        isChartLoading.value = false
        // Support both the new { chartData, kpis } shape and the legacy plain
        // array shape so callers that still return an array keep working.
        if (Array.isArray(result)) {
          chartData.value = result
          kpis.value = null
        } else {
          chartData.value = result?.chartData || []
          kpis.value = result?.kpis || null
        }
      })
      .catch((err) => {
        isChartLoading.value = false
        chartData.value = []
        kpis.value = null
        toast.add({
          closable: true,
          severity: 'warn',
          summary: 'Chart failed',
          detail: String(err).slice(0, 100),
          life: 5000
        })
      })
  }

  const load = async () => {
    if (isLoading.value) return
    const callId = ++loadCallId
    try {
      isLoading.value = true
      tableData.value = []
      hasMoreData.value = false
      chartData.value = []
      recordsFound.value = '—'

      loadChart()

      const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
      const originalEnd = new Date(filterData.value.tsRange.tsRangeEnd).getTime()
      currentWindowEnd = originalEnd
      currentOffset = 0
      isShortRange = originalEnd - originalBegin <= MAX_LIST_RANGE_MS

      const target = pageSize.value
      let records = []

      if (isShortRange) {
        const res = await listService.value({ ...filterData.value, pageSize: target, offset: 0 })
        records = res.data || []
        currentOffset = records.length
      } else {
        while (records.length < target && currentWindowEnd > originalBegin) {
          if (callId !== loadCallId) return
          const blockFilter = getListFilter(currentWindowEnd)
          const remaining = target - records.length
          const res = await listService.value({ ...blockFilter, pageSize: remaining, offset: 0 })
          records = [...records, ...(res.data || [])]
          currentWindowEnd = new Date(blockFilter.tsRange.tsRangeBegin).getTime()
          if ((res.data || []).length < remaining) continue
        }
      }

      tableData.value = records
      // Fallback: if chart hasn't emitted total-computed yet, use local count
      if (recordsFound.value === '—') {
        recordsFound.value = new Intl.NumberFormat('pt-BR').format(records.length)
      }
      const totalNum =
        typeof recordsFound.value === 'number'
          ? recordsFound.value
          : parseInt(String(recordsFound.value).replace(/\D/g, ''), 10)
      hasMoreData.value = isShortRange
        ? isNaN(totalNum) || records.length < totalNum
        : currentWindowEnd > originalBegin || isNaN(totalNum) || records.length < totalNum
    } catch (error) {
      toast.add({ closable: true, severity: 'error', summary: 'Error', detail: error })
      recordsFound.value = 0
      tableData.value = []
      chartData.value = []
      hasMoreData.value = false
    } finally {
      isLoading.value = false
      initialLoadDone.value = true
    }
  }

  const loadMore = async () => {
    if (isLoadingMore.value || !hasMoreData.value) return
    isLoadingMore.value = true
    try {
      const target = pageSize.value
      let newRecords = []
      if (isShortRange) {
        const res = await listService.value({
          ...filterData.value,
          pageSize: target,
          offset: currentOffset
        })
        newRecords = res.data || []
        currentOffset += newRecords.length
      } else {
        const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
        while (newRecords.length < target && currentWindowEnd > originalBegin) {
          const blockFilter = getListFilter(currentWindowEnd)
          const remaining = target - newRecords.length
          const res = await listService.value({ ...blockFilter, pageSize: remaining, offset: 0 })
          newRecords = [...newRecords, ...(res.data || [])]
          currentWindowEnd = new Date(blockFilter.tsRange.tsRangeBegin).getTime()
          if ((res.data || []).length < remaining) continue
        }
      }
      if (newRecords.length > 0) tableData.value = [...tableData.value, ...newRecords]
      const totalNum =
        typeof recordsFound.value === 'number'
          ? recordsFound.value
          : parseInt(String(recordsFound.value).replace(/\D/g, ''), 10)
      if (isShortRange) hasMoreData.value = !isNaN(totalNum) && tableData.value.length < totalNum
      else
        hasMoreData.value =
          currentWindowEnd > new Date(filterData.value.tsRange.tsRangeBegin).getTime()
    } catch (error) {
      toast.add({ closable: true, severity: 'error', summary: 'Error loading more', detail: error })
    } finally {
      isLoadingMore.value = false
    }
  }

  const setRecordsFound = (total) => {
    recordsFound.value = new Intl.NumberFormat('pt-BR').format(total)
  }

  return {
    tableData,
    chartData,
    kpis,
    recordsFound,
    isLoading,
    isChartLoading,
    hasMoreData,
    isLoadingMore,
    initialLoadDone,
    load,
    loadChart,
    loadMore,
    setRecordsFound
  }
}
