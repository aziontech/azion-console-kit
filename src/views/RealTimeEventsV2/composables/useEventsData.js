import { ref, shallowRef, triggerRef } from 'vue'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { useGraphQLStore } from '@/stores/graphql-query'
import { loadSummaryKpis } from '@/services/real-time-events-service-v2/load-events-aggregation'
import { buildFilterParts } from '@/services/real-time-events-service-v2/_shared/build-filter-parts'

const MAX_LIST_RANGE_MS = 2 * 60 * 60 * 1000

// When the chart's first request reports a non-partial total at or below this,
// the data is sparse enough that the list can be fetched with a single
// newest→oldest query over the whole range (the API skips the empty periods
// between "now" and the data internally) instead of walking it 2h window by
// 2h window. Above it the range is dense, so windowing keeps each request's
// scan bounded. Mirrors the aggregate `limit: 10000` used by the count query.
const SINGLE_QUERY_MAX_TOTAL = 10000

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
  // Total number of records known to exist in the current range+filter, taken
  // from loadTotalCount. Used to bound the windowed list walk so it stops once
  // every record has been collected instead of bailing on the first empty
  // window (sparse/filtered data has gaps between populated windows). null
  // until the count resolves.
  let knownTotalCount = null
  // Resolver for the in-flight chart-summary deferred. load() installs it right
  // before calling loadChart(); loadChart() resolves it with { total,
  // partialFilter } as soon as the chart's FIRST request returns — i.e. before
  // the optional KPI fallback — so the list loader can pick its fetch strategy
  // without waiting on that second request.
  let onChartSummary = null

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
    knownTotalCount = null
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
        knownTotalCount = total
        recordsFound.value = new Intl.NumberFormat(locale).format(total)
        return
      }
    } catch {
      /* system limit */
    }
    if (myToken !== countToken) return

    // 2) Fallback: 24h chunks, 2 at a time, newest→oldest, summing the whole
    // range. We must NOT stop on the first empty chunk: a specific filter
    // (e.g. one domain) can have empty chunks sitting between populated ones,
    // and bailing early would undercount — which in turn would let the list
    // walk stop short. A null chunk means the per-chunk request itself failed
    // (system limit); skip it rather than treating it as "no more data".
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
      for (const cnt of results) {
        if (cnt != null) grandTotal += cnt
      }
      hasAccurateCount = true
      knownTotalCount = grandTotal
      recordsFound.value = new Intl.NumberFormat(locale).format(grandTotal)
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

  /**
   * Loads the chart aggregation (the feature's first request) and returns a
   * compact summary the list loader uses to choose its fetch strategy:
   *   { total: number|null, partialFilter: boolean }
   * `total` is the event count the chart observed for the current range+filter
   * (null when unknown, e.g. the array/stacked form). `partialFilter` is true
   * when the Metrics API dropped unsupported filter fields, so the total does
   * NOT reflect every active filter and must not be trusted for bounding.
   * Returns null when there is no chart, the request was superseded, or it
   * failed. The KPI fallback runs fire-and-forget so it never blocks the list.
   */
  const loadChart = async () => {
    // Claim the summary resolver for this run (set by load() just before the
    // call). Settle it at most once, defaulting to null so a no-op/failed run
    // never leaves the list loader awaiting forever.
    const resolveSummary = onChartSummary
    onChartSummary = null
    let summarySettled = false
    const settleSummary = (summary) => {
      if (summarySettled) return
      summarySettled = true
      if (resolveSummary) resolveSummary(summary)
    }

    if (!hasChartConfig.value || !loadChartAggregation.value) {
      isChartLoading.value = false
      settleSummary(null)
      return null
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
      if (myToken !== chartLoadToken) {
        settleSummary(null)
        return null
      }
      isChartLoading.value = false
      if (Array.isArray(result)) {
        chartData.value = result
        kpis.value = null
        const summary = { total: null, partialFilter: false }
        settleSummary(summary)
        return summary
      }
      chartData.value = result?.chartData || []
      const rk = result?.kpis || null
      if (rk && result?.partialFilter) rk.partialFilter = true
      kpis.value = rk

      // Hand the list loader the total/partial summary now — before the
      // optional KPI fallback request — so it never waits on that second call.
      const summary = {
        total: typeof rk?.total === 'number' ? rk.total : null,
        partialFilter: !!result?.partialFilter
      }
      settleSummary(summary)

      // KPI fallback: when the chart path (Metrics API) did not attach KPIs,
      // OR attached incomplete KPIs (missing status breakdown / avg request time),
      // issue a dedicated Events-API KPI request (Requirement 6.1, 6.5, 6.6).
      const needsKpiFallback =
        (tabSelected.value?.showSummary ?? false) &&
        (rk === null || rk === undefined || !rk.supportsStatusBreakdown || !rk.supportsRequestTime)
      if (needsKpiFallback) {
        const fallback = await loadSummaryKpisSafe({
          dataset: tabSelected.value?.dataset,
          tsRange: filterData.value?.tsRange,
          filters: buildApiFilters(),
          token: myToken
        })
        if (myToken !== chartLoadToken) return summary
        if (fallback) {
          // Merge: chart-provided total preserved, fallback adds breakdown/avg
          kpis.value = {
            ...rk,
            ...fallback,
            partialFilter: !!result?.partialFilter
          }
        }
      }
      return summary
    } catch (err) {
      settleSummary(null)
      if (myToken !== chartLoadToken) return null
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
      return null
    }
  }

  // ── Fetch page with window+offset tracking ──────────────────────────
  const graphqlStore = useGraphQLStore()
  const onQuery = (payload) => {
    try {
      // payload is either a { query, variables } object (from convertGQL)
      // or a JSON string — handle both.
      const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload
      if (!parsed?.query) return
      const variables = { ...(parsed.variables ?? {}) }
      // For ranges longer than MAX_LIST_RANGE_MS the list is fetched in narrow
      // time windows (see getWindowFilter) as an internal pagination strategy.
      // That window leaks into the captured variables, so the GraphQL playground
      // would reproduce a ~2h slice instead of the user-selected range (e.g.
      // "this week"). Restore the full tsRange so the stored query matches what
      // the user actually selected.
      const fullRange = filterData.value?.tsRange
      if (fullRange?.tsRangeBegin && fullRange?.tsRangeEnd && 'tsRange_begin' in variables) {
        variables.tsRange_begin = fullRange.tsRangeBegin
        variables.tsRange_end = fullRange.tsRangeEnd
      }
      graphqlStore.setQuery({ query: parsed.query, variables })
    } catch {
      /* ignore */
    }
  }

  const fetchPage = async (target) => {
    const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
    let records = []
    if (isShortRange) {
      // Single query over the whole range, newest→oldest, with offset paging.
      // currentWindowEnd is the range end already clamped to "now", so a future
      // preset end (e.g. "this week") never leaks into the query. tsRangeBegin
      // stays the full range begin — the API returns the newest `target` rows
      // and skips any empty span between "now" and the data on its own.
      const clamped = {
        ...filterData.value,
        tsRange: {
          ...filterData.value.tsRange,
          tsRangeEnd: new Date(currentWindowEnd).toISOString()
        }
      }
      const res = await listService.value(
        { ...clamped, pageSize: target, offset: currentWindowOffset },
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
        // Window exhausted or empty — move to the next (older) window.
        currentWindowEnd = new Date(windowFilter.tsRange.tsRangeBegin).getTime()
        currentWindowOffset = 0
        // Stop only once we've collected every record known to exist in the
        // range. An empty window must NOT abort the walk on its own: sparse or
        // heavily-filtered data (e.g. a single domain over "this week") often
        // has empty windows between populated ones, so bailing on the first
        // gap would return an empty list even though data exists further back.
        // While the count is still resolving (knownTotalCount === null) we keep
        // walking; the loop is bounded by currentWindowEnd > originalBegin.
        if (knownTotalCount != null && records.length >= knownTotalCount) break
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
      // Install the summary deferred, then kick off the chart. loadChart()
      // resolves chartSummaryPromise as soon as its first request returns
      // (before the optional KPI fallback) and finishes the rest in the
      // background, so we get the total without blocking on a second request.
      const chartSummaryPromise = new Promise((resolve) => {
        onChartSummary = resolve
      })
      loadChart().catch(() => {})
      loadTotalCount().catch(() => {})
      const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
      const originalEnd = new Date(filterData.value.tsRange.tsRangeEnd).getTime()
      // Calendar presets like "this week" / "today" end at the end of the
      // current day, i.e. in the future. Clamp the range end to "now" so a
      // future end never leaks into the query (the future has no data and would
      // otherwise be probed first).
      currentWindowEnd = Math.min(originalEnd, Date.now())
      currentWindowOffset = 0

      // Reuse the chart's first request (already in flight above) to pick the
      // list fetch strategy instead of blindly walking the range window by
      // window from "now". When the chart reports a small, fully-applied
      // (non-partial) total, the data is sparse: a single newest→oldest query
      // over the whole range returns it directly and the API skips the empty
      // span between "now" and the data — so for the common "one domain over
      // this week" case we issue one request, not dozens. A zero total proves
      // the list is empty up front, so we skip the list request entirely.
      let singleQuery = false
      const chartSummary = await chartSummaryPromise
      if (callId !== loadCallId) return
      if (chartSummary && !chartSummary.partialFilter && typeof chartSummary.total === 'number') {
        knownTotalCount = chartSummary.total
        if (chartSummary.total === 0) {
          tableData.value = []
          recordsFound.value = new Intl.NumberFormat(locale).format(0)
          hasMoreData.value = false
          return
        }
        singleQuery = chartSummary.total <= SINGLE_QUERY_MAX_TOTAL
      }

      isShortRange = singleQuery || currentWindowEnd - originalBegin <= MAX_LIST_RANGE_MS
      const records = await fetchPage(pageSize.value)
      if (callId !== loadCallId) return
      tableData.value = records
      const totalNum =
        typeof recordsFound.value === 'number'
          ? recordsFound.value
          : parseInt(String(recordsFound.value).replace(/\D/g, ''), 10)
      hasMoreData.value =
        records.length > 0 &&
        (knownTotalCount != null
          ? records.length < knownTotalCount
          : isShortRange
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
        (knownTotalCount != null
          ? tableData.value.length < knownTotalCount
          : isShortRange
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
