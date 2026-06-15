import { ref, shallowRef, triggerRef } from 'vue'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { useGraphQLStore } from '@/stores/graphql-query'
import { loadSummaryKpis } from '@/services/real-time-events-service-v2/load-events-aggregation'
import { buildFilterParts } from '@/services/real-time-events-service-v2/_shared/build-filter-parts'

const MAX_LIST_RANGE_MS = 2 * 60 * 60 * 1000

export function useEventsData({
  filterData,
  listService,
  loadChartAggregation,
  tabSelected,
  pageSize,
  hasChartConfig,
  onError = () => {},
  stackByField = null,
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
      tsRange: {
        ...filter.tsRange,
        tsRangeBegin: new Date(wBegin).toISOString(),
        tsRangeEnd: new Date(windowEnd).toISOString()
      }
    }
  }

  const coerceFilterValue = (rawValue, type) => {
    const nt = String(type || '').toLowerCase()
    if (Array.isArray(rawValue))
      return rawValue.map((iv) => coerceFilterValue(iv?.value !== undefined ? iv.value : iv, type))
    if (nt === 'int') {
      const nv = parseInt(rawValue, 10)
      return Number.isFinite(nv) ? nv : rawValue
    }
    if (nt === 'float' || nt === 'number') {
      const nv = parseFloat(rawValue)
      return Number.isFinite(nv) ? nv : rawValue
    }
    if (nt === 'boolean' || nt === 'bool') {
      if (rawValue === true || rawValue === false) return rawValue
      const sv = String(rawValue).toLowerCase()
      if (sv === 'true') return true
      if (sv === 'false') return false
      return rawValue
    }
    return rawValue
  }

  // Builds one AND-group object ({ and, in }) from a list of clauses.
  const buildFilterGroup = (clauses) => {
    const group = {}
    clauses.forEach((ff) => {
      // Defensive guard: skip clauses whose operator is missing, falsy,
      // or non-string. This prevents emitting malformed GraphQL filter
      // keys like `${valueField}undefined` when the parser (or any other
      // upstream source) hands us a clause without a resolved operator.
      // See spec: realtime-events-filter-operator-bug — Requirement 2.3, 2.4.
      if (typeof ff.operator !== 'string' || ff.operator.length === 0) return
      const value = coerceFilterValue(ff.value, ff.type)
      if (ff.operator === 'In') {
        group.in = group.in || {}
        const existing = Array.isArray(group.in[ff.valueField]) ? group.in[ff.valueField] : []
        group.in[ff.valueField] = [...existing, ...(Array.isArray(value) ? value : [value])]
      } else {
        group.and = group.and || {}
        group.and[ff.valueField + ff.operator] = value
      }
    })
    return group
  }

  // Produces the filter shape consumed by the query builders:
  //   - no OR connector → flat AND-only filter `{ and, in }`
  //   - any OR connector → `{ or: [ { and, in }, ... ] }`, splitting clauses
  //     into AND-groups at each OR boundary (SQL precedence: AND binds tighter
  //     than OR, so `a AND b OR c` ⇒ `(a AND b) OR c`). The events GraphQL
  //     filter supports nested `or`, verified against the live schema.
  const buildApiFilters = () => {
    const fields = filterData.value?.fields
    if (!Array.isArray(fields) || !fields.length) return {}

    const hasOr = fields.some((ff) => String(ff?.logicalOperator).toUpperCase() === 'OR')
    if (!hasOr) return buildFilterGroup(fields)

    const groups = []
    fields.forEach((ff) => {
      if (!groups.length || String(ff?.logicalOperator).toUpperCase() === 'OR') groups.push([])
      groups[groups.length - 1].push(ff)
    })
    return { or: groups.map(buildFilterGroup) }
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

  const hasActiveFilters = () => {
    const af = buildApiFilters()
    return (
      Object.keys(af?.and || {}).length > 0 ||
      Object.keys(af?.in || {}).length > 0 ||
      (Array.isArray(af?.or) && af.or.length > 0)
    )
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

    // Render the extra filter (and/in/or) via the shared helper so OR groups
    // produce a nested `or: [ ... ]` fragment consistent with the list query.
    const { fragments, declarations, variables: filterVars } = buildFilterParts(filters, 'f')
    const buildBody = (tsBegin, tsEnd) => {
      const vars = { tsBegin: tsBegin, tsEnd: tsEnd, ...filterVars }
      const pStr = ['$tsBegin: DateTime!', '$tsEnd: DateTime!', ...declarations].join(', ')
      const fStr = ['tsRange: { begin: $tsBegin, end: $tsEnd }', ...fragments].join(', ')
      return JSON.stringify({
        query:
          'query (' +
          pStr +
          ') { ' +
          dataset +
          '(limit: 10000, aggregate: { count: rows }, filter: { ' +
          fStr +
          ' }) { count } }',
        variables: vars
      })
    }
    const doReq = async (body) => {
      const resp = await AxiosHttpClientAdapter.request({
        baseURL: '/',
        url: 'v4/events/graphql',
        method: 'POST',
        body
      })
      if (resp.statusCode !== 200) return null
      const rows = resp.body?.data?.[dataset]
      if (!Array.isArray(rows) || rows.length === 0) return 0
      return rows[0]?.count != null ? rows[0].count : 0
    }

    // 1) Try full range
    try {
      const total = await doReq(
        buildBody(new Date(beginMs).toISOString(), new Date(endMs).toISOString())
      )
      if (myToken !== countToken) return
      if (total != null) {
        hasAccurateCount = true
        recordsFound.value = new Intl.NumberFormat(locale).format(total)
        return
      }
    } catch {
      /* system limit */
    }
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
      const results = await Promise.all(
        batch.map((ch) => doReq(buildBody(ch.begin, ch.end)).catch(() => 0))
      )
      if (myToken !== countToken) return
      let hitZero = false
      for (const cnt of results) {
        if (cnt === null || cnt === 0) {
          hitZero = true
          break
        }
        grandTotal += cnt
      }
      hasAccurateCount = true
      recordsFound.value = new Intl.NumberFormat(locale).format(grandTotal)
      if (hitZero) break
    }
  }

  // ── Chart ────────────────────────────────────────────────────────────

  /**
   * Wraps loadSummaryKpis with:
   * - try/catch that swallows errors and returns null (Requirement 6.7)
   * - token check to cancel superseded requests (Requirement 6.8)
   */
  const loadSummaryKpisSafe = async ({ dataset, tsRange, filters, token }) => {
    try {
      const result = await loadSummaryKpis({ dataset, tsRange, filters })
      // token is a monotonic request-supersession counter, not a secret; this
      // is a stale-response guard, so timing-safe comparison does not apply.
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token !== chartLoadToken) return null
      return result
    } catch {
      return null
    }
  }

  const loadChart = async () => {
    if (!hasChartConfig.value || !loadChartAggregation.value) {
      isChartLoading.value = false
      return
    }
    const myToken = ++chartLoadToken
    isChartLoading.value = true
    try {
      const result = await loadChartAggregation.value({
        dataset: tabSelected.value?.dataset,
        tsRange: filterData.value?.tsRange,
        filters: buildApiFilters(),
        groupByField: resolveStackField()
      })
      if (myToken !== chartLoadToken) return
      isChartLoading.value = false
      if (Array.isArray(result)) {
        chartData.value = result
        kpis.value = null
      } else {
        chartData.value = result?.chartData || []
        const rk = result?.kpis || null
        if (rk && result?.partialFilter) rk.partialFilter = true
        kpis.value = rk

        // KPI fallback: when the chart path (Metrics API) did not attach KPIs,
        // OR attached incomplete KPIs (missing status breakdown / avg request time),
        // issue a dedicated Events-API KPI request (Requirement 6.1, 6.5, 6.6)
        const needsKpiFallback =
          (tabSelected.value?.showSummary ?? false) &&
          (rk === null ||
            rk === undefined ||
            !rk.supportsStatusBreakdown ||
            !rk.supportsRequestTime)
        if (needsKpiFallback) {
          const fallback = await loadSummaryKpisSafe({
            dataset: tabSelected.value?.dataset,
            tsRange: filterData.value?.tsRange,
            filters: buildApiFilters(),
            token: myToken
          })
          if (myToken !== chartLoadToken) return
          if (fallback) {
            // Merge: chart-provided total preserved, fallback adds breakdown/avg
            kpis.value = {
              ...rk,
              ...fallback,
              partialFilter: !!result?.partialFilter
            }
          }
        }
      }
    } catch (err) {
      if (myToken !== chartLoadToken) return
      isChartLoading.value = false
      chartData.value = []
      kpis.value = null
      // Task 11.1 — user-facing toast for GraphQL chart failures. The
      // service already logs structured details (event: graphql_error);
      // here we surface a friendly message so the user knows what to do.
      onError({
        closable: true,
        severity: 'error',
        summary: 'Error loading events',
        detail: 'Please try again or contact support',
        life: 5000
      })
    }
  }

  // ── Fetch page with window+offset tracking ──────────────────────────
  const graphqlStore = useGraphQLStore()
  const onQuery = (payload) => {
    try {
      // payload is either a { query, variables } object (from convertGQL)
      // or a JSON string — handle both.
      const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload
      if (parsed?.query)
        graphqlStore.setQuery({ query: parsed.query, variables: parsed.variables ?? {} })
    } catch {
      /* ignore */
    }
  }

  const fetchPage = async (target) => {
    const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
    let records = []
    if (isShortRange) {
      const res = await listService.value(
        { ...filterData.value, pageSize: target, offset: currentWindowOffset },
        { onQuery }
      )
      records = res.data || []
      currentWindowOffset += records.length
      return records
    }
    while (records.length < target && currentWindowEnd > originalBegin) {
      const windowFilter = getWindowFilter(currentWindowEnd)
      const remaining = target - records.length
      const res = await listService.value(
        { ...windowFilter, pageSize: remaining, offset: currentWindowOffset },
        { onQuery }
      )
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
    await new Promise((resolve) => {
      loadDebounceTimer = setTimeout(resolve, 50)
    })
    if (!filterData.value?.tsRange?.tsRangeBegin || !filterData.value?.tsRange?.tsRangeEnd) return
    const callId = ++loadCallId
    try {
      isLoading.value = true
      tableData.value = []
      hasMoreData.value = false
      chartData.value = []
      recordsFound.value = '—'
      hasAccurateCount = false
      loadChart()
      loadTotalCount().catch(() => {})
      const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
      const originalEnd = new Date(filterData.value.tsRange.tsRangeEnd).getTime()
      currentWindowEnd = originalEnd
      currentWindowOffset = 0
      isShortRange = originalEnd - originalBegin <= MAX_LIST_RANGE_MS
      const records = await fetchPage(pageSize.value)
      if (callId !== loadCallId) return
      tableData.value = records
      const totalNum =
        typeof recordsFound.value === 'number'
          ? recordsFound.value
          : parseInt(String(recordsFound.value).replace(/\D/g, ''), 10)
      hasMoreData.value =
        records.length > 0 &&
        (isShortRange
          ? isNaN(totalNum) || records.length < totalNum
          : currentWindowEnd > originalBegin || records.length >= pageSize.value)
    } catch (error) {
      onError({ closable: true, severity: 'error', summary: 'Error', detail: error })
      recordsFound.value = '—'
      tableData.value = []
      chartData.value = []
      hasMoreData.value = false
    } finally {
      if (callId === loadCallId) {
        isLoading.value = false
        initialLoadDone.value = true
      }
    }
  }

  // ── Load More ────────────────────────────────────────────────────────
  const loadMore = async () => {
    if (isLoadingMore.value || !hasMoreData.value) return
    isLoadingMore.value = true
    try {
      const newRecords = await fetchPage(pageSize.value)
      if (newRecords.length > 0) {
        tableData.value.push(...newRecords)
        triggerRef(tableData)
      }
      const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
      hasMoreData.value =
        newRecords.length > 0 &&
        (isShortRange
          ? newRecords.length >= pageSize.value
          : currentWindowEnd > originalBegin || newRecords.length >= pageSize.value)
    } catch (error) {
      onError({ closable: true, severity: 'error', summary: 'Error loading more', detail: error })
    } finally {
      isLoadingMore.value = false
    }
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
