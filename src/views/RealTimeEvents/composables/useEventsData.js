import { ref, shallowRef, triggerRef } from 'vue'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { useGraphQLStore } from '@/stores/graphql-query'

const MAX_LIST_RANGE_MS = 2 * 60 * 60 * 1000

export function useEventsData({
  filterData, listService, loadChartAggregation, tabSelected, pageSize,
  hasChartConfig, onError = () => {}, stackByField = null,
  locale = typeof navigator !== 'undefined' ? navigator.language : 'en'
}) {
  const tableData = shallowRef([])
  const chartData = ref([])
  const kpis = ref(null)
  const recordsFound = ref('—')
  const isLoading = ref(false)
  const isChartLoading = ref(false)
  const hasMoreData = ref(false)
  const isLoadingMore = ref(false)
  const initialLoadDone = ref(false)

  let currentWindowEnd = null
  let currentWindowOffset = 0
  let isShortRange = false
  let loadCallId = 0
  let chartLoadToken = 0
  let countToken = 0
  let hasAccurateCount = false

  const getWindowFilter = (windowEnd) => {
    const filter = filterData.value
    const begin = new Date(filter.tsRange.tsRangeBegin).getTime()
    const wBegin = Math.max(windowEnd - MAX_LIST_RANGE_MS, begin)
    return {
      ...filter,
      tsRange: { ...filter.tsRange, tsRangeBegin: new Date(wBegin).toISOString(), tsRangeEnd: new Date(windowEnd).toISOString() }
    }
  }

  const coerceFilterValue = (rawValue, type) => {
    const nt = String(type || '').toLowerCase()
    if (Array.isArray(rawValue)) return rawValue.map((iv) => coerceFilterValue(iv?.value !== undefined ? iv.value : iv, type))
    if (nt === 'int') { const nv = parseInt(rawValue, 10); return Number.isFinite(nv) ? nv : rawValue }
    if (nt === 'float' || nt === 'number') { const nv = parseFloat(rawValue); return Number.isFinite(nv) ? nv : rawValue }
    if (nt === 'boolean' || nt === 'bool') {
      if (rawValue === true || rawValue === false) return rawValue
      const sv = String(rawValue).toLowerCase()
      if (sv === 'true') return true; if (sv === 'false') return false
      return rawValue
    }
    return rawValue
  }

  const buildApiFilters = () => {
    const filters = {}
    if (filterData.value?.fields?.length) {
      filterData.value.fields.forEach((ff) => {
        const value = coerceFilterValue(ff.value, ff.type)
        if (ff.operator === 'In') { filters.in = filters.in || {}; filters.in[ff.valueField] = value }
        else { filters.and = filters.and || {}; filters.and[ff.valueField + ff.operator] = value }
      })
    }
    return filters
  }

  const resolveStackField = () => {
    if (!stackByField) return null
    const raw = typeof stackByField === 'object' && 'value' in stackByField ? stackByField.value : stackByField
    if (!raw || raw === 'none') return null
    return String(raw)
  }

  const hasActiveFilters = () => {
    const af = buildApiFilters()
    return Object.keys(af?.and || {}).length > 0 || Object.keys(af?.in || {}).length > 0
  }

  // ── Count (only when filters are active) ─────────────────────────────
  const loadTotalCount = async () => {
    const myToken = ++countToken
    hasAccurateCount = false
    const dataset = tabSelected.value?.dataset
    if (!dataset || !filterData.value?.tsRange) return
    if (!hasActiveFilters()) return

    const beginMs = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
    const endMs = new Date(filterData.value.tsRange.tsRangeEnd).getTime()
    const filters = buildApiFilters()

    const extraVarDefs = {}
    const extraFilterParts = []
    Object.entries(filters?.and || {}).forEach(([key, val]) => {
      const varName = 'f_' + key; extraVarDefs[varName] = val; extraFilterParts.push(key + ': $' + varName)
    })
    Object.entries(filters?.in || {}).forEach(([key, val]) => {
      const varName = 'i_' + key
      extraVarDefs[varName] = Array.isArray(val) ? val.map((item) => String(item?.value !== undefined ? item.value : item)) : val
      extraFilterParts.push((key.endsWith('In') ? key : key + 'In') + ': $' + varName)
    })
    const paramType = (key, value) => {
      if (key === 'tsBegin' || key === 'tsEnd') return 'DateTime!'
      if (Array.isArray(value)) return '[String]'
      if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float'
      return 'String'
    }
    const buildBody = (tsBegin, tsEnd) => {
      const vars = { tsBegin: tsBegin, tsEnd: tsEnd, ...extraVarDefs }
      const pStr = Object.entries(vars).map(([key, value]) => '$' + key + ': ' + paramType(key, value)).join(', ')
      const fStr = ['tsRange: { begin: $tsBegin, end: $tsEnd }', ...extraFilterParts].join(', ')
      return JSON.stringify({
        query: 'query (' + pStr + ') { ' + dataset + '(limit: 10000, aggregate: { count: rows }, filter: { ' + fStr + ' }) { count } }',
        variables: vars
      })
    }
    const doReq = async (body) => {
      const resp = await AxiosHttpClientAdapter.request({ baseURL: '/', url: 'v4/events/graphql', method: 'POST', body })
      if (resp.statusCode !== 200) return null
      const rows = resp.body?.data?.[dataset]
      if (!Array.isArray(rows) || rows.length === 0) return 0
      return rows[0]?.count != null ? rows[0].count : 0
    }

    // 1) Try full range
    try {
      const total = await doReq(buildBody(new Date(beginMs).toISOString(), new Date(endMs).toISOString()))
      if (myToken !== countToken) return
      if (total != null) { hasAccurateCount = true; recordsFound.value = new Intl.NumberFormat(locale).format(total); return }
    } catch { /* system limit */ }
    if (myToken !== countToken) return

    // 2) Fallback: 24h chunks, 2 at a time, newest→oldest, stop on first 0
    const CHUNK_MS = 24 * 60 * 60 * 1000
    let grandTotal = 0
    let cursor = endMs
    while (cursor > beginMs) {
      if (myToken !== countToken) return
      const batch = []
      for (let bi = 0; bi < 2 && cursor > beginMs; bi++) {
        const cb = Math.max(cursor - CHUNK_MS, beginMs)
        batch.push({ begin: new Date(cb).toISOString(), end: new Date(cursor).toISOString() })
        cursor = cb
      }
      const results = await Promise.all(batch.map((ch) => doReq(buildBody(ch.begin, ch.end)).catch(() => 0)))
      if (myToken !== countToken) return
      let hitZero = false
      for (const cnt of results) {
        if (cnt === null || cnt === 0) { hitZero = true; break }
        grandTotal += cnt
      }
      hasAccurateCount = true
      recordsFound.value = new Intl.NumberFormat(locale).format(grandTotal)
      if (hitZero) break
    }
  }

  // ── Chart ────────────────────────────────────────────────────────────
  const loadChart = () => {
    if (!hasChartConfig.value || !loadChartAggregation.value) { isChartLoading.value = false; return }
    const myToken = ++chartLoadToken
    isChartLoading.value = true
    loadChartAggregation.value({
      dataset: tabSelected.value?.dataset, tsRange: filterData.value?.tsRange,
      filters: buildApiFilters(), groupByField: resolveStackField()
    })
      .then((result) => {
        if (myToken !== chartLoadToken) return
        isChartLoading.value = false
        if (Array.isArray(result)) { chartData.value = result; kpis.value = null }
        else {
          chartData.value = result?.chartData || []
          const rk = result?.kpis || null
          if (rk && result?.partialFilter) rk.partialFilter = true
          kpis.value = rk
        }
      })
      .catch((err) => {
        if (myToken !== chartLoadToken) return
        isChartLoading.value = false; chartData.value = []; kpis.value = null
        onError({ closable: true, severity: 'warn', summary: 'Chart failed', detail: String(err).slice(0, 100), life: 5000 })
      })
  }

  // ── Fetch page with window+offset tracking ──────────────────────────
  const graphqlStore = useGraphQLStore()
  const onQuery = (payload) => {
    try {
      // payload is either a { query, variables } object (from convertGQL)
      // or a JSON string — handle both.
      const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload
      if (parsed?.query) graphqlStore.setQuery({ query: parsed.query, variables: parsed.variables ?? {} })
    } catch { /* ignore */ }
  }

  const fetchPage = async (target) => {
    const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
    let records = []
    if (isShortRange) {
      const res = await listService.value({ ...filterData.value, pageSize: target, offset: currentWindowOffset }, { onQuery })
      records = res.data || []
      currentWindowOffset += records.length
      return records
    }
    while (records.length < target && currentWindowEnd > originalBegin) {
      const windowFilter = getWindowFilter(currentWindowEnd)
      const remaining = target - records.length
      const res = await listService.value({ ...windowFilter, pageSize: remaining, offset: currentWindowOffset }, { onQuery })
      const batch = res.data || []
      records = [...records, ...batch]
      if (batch.length < remaining) {
        // Window exhausted or empty — move to next window
        currentWindowEnd = new Date(windowFilter.tsRange.tsRangeBegin).getTime()
        currentWindowOffset = 0
        // If this window returned nothing, stop — older windows won't have data either
        if (batch.length === 0) break
      } else {
        currentWindowOffset += batch.length
      }
    }
    return records
  }

  // ── Load ─────────────────────────────────────────────────────────────
  let loadDebounceTimer = null

  const load = async () => {
    if (loadDebounceTimer) clearTimeout(loadDebounceTimer)
    await new Promise((resolve) => { loadDebounceTimer = setTimeout(resolve, 50) })
    if (!filterData.value?.tsRange?.tsRangeBegin || !filterData.value?.tsRange?.tsRangeEnd) return
    const callId = ++loadCallId
    try {
      isLoading.value = true; tableData.value = []; hasMoreData.value = false
      chartData.value = []; recordsFound.value = '—'; hasAccurateCount = false
      loadChart()
      loadTotalCount().catch(() => {})
      const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
      const originalEnd = new Date(filterData.value.tsRange.tsRangeEnd).getTime()
      currentWindowEnd = originalEnd; currentWindowOffset = 0
      isShortRange = originalEnd - originalBegin <= MAX_LIST_RANGE_MS
      const records = await fetchPage(pageSize.value)
      if (callId !== loadCallId) return
      tableData.value = records
      const totalNum = typeof recordsFound.value === 'number'
        ? recordsFound.value : parseInt(String(recordsFound.value).replace(/\D/g, ''), 10)
      hasMoreData.value = records.length > 0 && (isShortRange
        ? isNaN(totalNum) || records.length < totalNum
        : currentWindowEnd > originalBegin || records.length >= pageSize.value)
    } catch (error) {
      onError({ closable: true, severity: 'error', summary: 'Error', detail: error })
      recordsFound.value = '—'; tableData.value = []; chartData.value = []; hasMoreData.value = false
    } finally {
      if (callId === loadCallId) { isLoading.value = false; initialLoadDone.value = true }
    }
  }

  // ── Load More ────────────────────────────────────────────────────────
  const loadMore = async () => {
    if (isLoadingMore.value || !hasMoreData.value) return
    isLoadingMore.value = true
    try {
      const newRecords = await fetchPage(pageSize.value)
      if (newRecords.length > 0) { tableData.value.push(...newRecords); triggerRef(tableData) }
      const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
      hasMoreData.value = newRecords.length > 0 && (isShortRange
        ? newRecords.length >= pageSize.value
        : currentWindowEnd > originalBegin || newRecords.length >= pageSize.value)
    } catch (error) {
      onError({ closable: true, severity: 'error', summary: 'Error loading more', detail: error })
    } finally { isLoadingMore.value = false }
  }

  // ── setRecordsFound (called by chart @total-computed) ────────────────
  const setRecordsFound = (total) => {
    if (hasAccurateCount) return
    if (kpis.value?.partialFilter) return
    if (total <= 0) return
    recordsFound.value = new Intl.NumberFormat(locale).format(total)
    hasAccurateCount = true
  }

  return {
    tableData, chartData, kpis, recordsFound, isLoading, isChartLoading,
    hasMoreData, isLoadingMore, initialLoadDone, load, loadChart, loadMore, setRecordsFound
  }
}
