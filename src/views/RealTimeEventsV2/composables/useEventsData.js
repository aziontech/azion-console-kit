import { ref, computed, shallowRef } from 'vue'
import { useGraphQLStore } from '@/stores/graphql-query'
import { loadSummaryKpis } from '@/services/real-time-events-service-v2/load-events-aggregation'
import { loadEventsCount } from '@/services/real-time-events-service-v2/load-events-count'
import { buildFilter } from '@/services/real-time-events-service-v2/_shared/filter/build-filter'

const MAX_LIST_RANGE_MS = 2 * 60 * 60 * 1000

// At/below this non-partial chart total the data is sparse enough to fetch with
// a single newest→oldest query over the whole range (the API skips empty periods)
// instead of walking it window by window; above it, windowing bounds each scan.
// Mirrors the aggregate `limit: 10000` used by the count query.
const SINGLE_QUERY_MAX_TOTAL = 10000

// Max time the list fetch waits on the chart summary before proceeding on its
// own (fix F5). The chart summary is only an optimization input; blocking the
// list on a slow chart request produced a multi-second blank table.
const CHART_SUMMARY_WAIT_MS = 400

export function useEventsData({
  filterData,
  listService,
  loadChartAggregation,
  tabSelected,
  pageSize,
  hasChartConfig,
  onError = () => {},
  stackByField = null,
  // Reactive gate for the events chart-aggregation co-fire inside load(). When
  // truthy the co-fire is skipped (page-size reloads, metrics views) but the
  // chart-summary deferred is still settled as null so the list falls back to the
  // window walk. Default: never suppress.
  suppressChartAgg = null,
  locale = typeof navigator !== 'undefined' ? navigator.language : 'en'
}) {
  const tableData = shallowRef([])
  const chartData = ref([])
  const kpis = ref(null)
  // Count Single-Source-of-Truth (design §2.1(5)/§3.7): held NUMERICALLY end-to-
  // end. `null` = not counted yet; a number (incl. 0) = counted. Formatting to the
  // displayed string happens only at the display edge (`recordsFound`), so there
  // is no string→number parse-back inside load().
  const recordsCount = ref(null)
  // Display projection of the numeric count. Consumers (DiscoverToolbar,
  // LoadMoreFooter) read this exactly as before, so the DISPLAYED value is
  // unchanged: `null` → the em-dash placeholder, any number → locale-formatted
  // (0 → "0", distinct from the placeholder).
  const recordsFound = computed(() =>
    recordsCount.value == null ? '—' : new Intl.NumberFormat(locale).format(recordsCount.value)
  )
  const isLoading = ref(false)
  const isChartLoading = ref(false)
  // Deterministic error signal for the events chart load path (req 2.4). Set true
  // when a chart aggregation fails; cleared on a new/successful load. Drives
  // EventChart's visible error state (was: empty chart + toast only). Superseded
  // (stale-token) runs never flip it.
  const chartHasError = ref(false)
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
  // Total records known to exist in the current range+filter (from loadTotalCount).
  // Bounds the windowed list walk so it stops once every record is collected
  // instead of bailing on the first empty window (sparse data has gaps). null
  // until the count resolves.
  let knownTotalCount = null
  // Resolver for the in-flight chart-summary deferred. load() installs it before
  // loadChart(), which resolves it with { total, partialFilter } as soon as the
  // chart's FIRST request returns (before the optional KPI fallback), so the list
  // loader picks its fetch strategy without waiting on that second request.
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

  // Delegates to the shared `buildFilter` (L1 filter domain), reading the
  // current `filterData.value?.fields`. Byte-equivalent to the previous inline
  // implementation: same `{ and, in, or }` shape, same OR-splitting precedence.
  const buildApiFilters = () => buildFilter(filterData.value?.fields)

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

  // Single writer for an exact (accurate) count: sets the numeric count, marks
  // it accurate, and updates the walk bound. Mirrors the old inline writers at
  // useEventsData:155-157/189-191 — now numeric, formatted only at the edge.
  const writeAccurateCount = (total) => {
    hasAccurateCount = true
    knownTotalCount = total
    recordsCount.value = total
  }

  // ── Count (only when filters are active) ─────────────────────────────
  // Range + 24h-fallback query logic lives in the numeric `loadEventsCount`
  // service (§3.10); this wrapper keeps the supersession token, active-filters
  // gate, and the single recency-guarded numeric writer (no string round-trip).
  const loadTotalCount = async () => {
    const myToken = ++countToken
    hasAccurateCount = false
    knownTotalCount = null
    const dataset = tabSelected.value?.dataset
    if (!dataset || !filterData.value?.tsRange) return
    if (!hasActiveFilters()) return

    const total = await loadEventsCount({
      dataset,
      tsRange: filterData.value.tsRange,
      filters: buildApiFilters(),
      // Surface each fallback batch's running total exactly as the inline
      // version did (per-batch write), still guarded by the supersession token.
      onPartial: (runningTotal) => {
        if (myToken !== countToken) return
        writeAccurateCount(runningTotal)
      }
    })
    if (myToken !== countToken) return
    if (total != null) writeAccurateCount(total)
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
   * Loads the chart aggregation (first request) and returns the summary
   * `{ total: number|null, partialFilter: boolean }` the list loader uses to pick
   * its fetch strategy. `partialFilter` true = Metrics API dropped filter fields
   * (total not trustworthy for bounding). Null on no-chart/superseded/failed.
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
    // Clear any prior error at the start of a fresh attempt so a retry that
    // succeeds leaves the error state behind (loading → success, not stuck).
    chartHasError.value = false
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
      // Requirement 2.4: surface a visible chart error state, not an empty
      // chart. This flag is consumed by EventChart's `hasError` prop.
      chartHasError.value = true
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
      // Long ranges are fetched in narrow time windows (getWindowFilter); that
      // window leaks into the captured variables, so the playground would
      // reproduce a ~2h slice instead of the user-selected range. Restore the
      // full tsRange so the stored query matches the selection.
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

  const fetchPage = async (target, callId = loadCallId) => {
    const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
    let records = []
    if (isShortRange) {
      // Single query over the whole range, newest→oldest, with offset paging.
      // currentWindowEnd is clamped to "now" (no future preset end leaks in);
      // tsRangeBegin stays the full range begin — the API returns the newest
      // `target` rows and skips any empty span between "now" and the data.
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
      // A superseded load must not keep walking windows and corrupting the
      // shared cursor (fix C5).
      if (callId !== loadCallId) break
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
        // Stop only once every known record is collected. An empty window must
        // NOT abort the walk: sparse/filtered data has empty windows between
        // populated ones. While the count is still resolving we keep walking; the
        // loop is bounded by currentWindowEnd > originalBegin.
        if (knownTotalCount != null && records.length >= knownTotalCount) break
      } else {
        currentWindowOffset += batch.length
      }
    }
    return records
  }

  // ── hasMore (single source of truth) ─────────────────────────────────
  // load()/loadMore() share ONE precedence: (1) exact count known → accumulated <
  // count; (2) short range → below displayed count (loadMore: "page was full");
  // (3) windowed → more windows remain or page was full. accumulatedCount = table len.
  const computeHasMoreData = ({
    pageRecordsLength,
    accumulatedCount,
    knownTotalCount: known,
    isShortRange: shortRange,
    currentWindowEnd: windowEnd,
    originalBegin,
    pageSize: size,
    totalNum = null
  }) => {
    if (pageRecordsLength <= 0) return false
    if (known != null) return accumulatedCount < known
    if (shortRange) {
      return totalNum != null
        ? Number.isNaN(totalNum) || accumulatedCount < totalNum
        : pageRecordsLength >= size
    }
    return windowEnd > originalBegin || pageRecordsLength >= size
  }

  // ── Load ─────────────────────────────────────────────────────────────
  let loadDebounceTimer = null

  const load = async ({ skipChart: skipChartArg = false } = {}) => {
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
      // Skip the co-fired chart aggregation when the reload seam flagged it wasted
      // (page-size reload or metrics view). Computed BEFORE the resets below on
      // purpose: clearing chartData/recordsCount while skipping the re-fetch
      // blanked the chart + count on every page-size change. Skipped → preserve them.
      const skipChart = skipChartArg || !!(suppressChartAgg && suppressChartAgg.value)
      if (!skipChart) {
        chartData.value = []
        recordsCount.value = null
        hasAccurateCount = false
      }
      // Install the summary deferred, then kick off the chart. loadChart()
      // resolves chartSummaryPromise as soon as its first request returns
      // (before the optional KPI fallback) and finishes the rest in the
      // background, so we get the total without blocking on a second request.
      const chartSummaryPromise = new Promise((resolve) => {
        onChartSummary = resolve
      })
      if (skipChart) {
        isChartLoading.value = false
        if (onChartSummary) {
          const settle = onChartSummary
          onChartSummary = null
          settle(null)
        }
      } else {
        loadChart().catch(() => {})
      }
      loadTotalCount().catch(() => {})
      const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
      const originalEnd = new Date(filterData.value.tsRange.tsRangeEnd).getTime()
      // Calendar presets like "this week" / "today" end at the end of the
      // current day, i.e. in the future. Clamp the range end to "now" so a
      // future end never leaks into the query (the future has no data and would
      // otherwise be probed first).
      currentWindowEnd = Math.min(originalEnd, Date.now())
      currentWindowOffset = 0

      // Reuse the chart's in-flight first request to pick the list fetch strategy
      // instead of blindly walking window by window. A small non-partial total
      // means sparse data → one newest→oldest query suffices; a zero total means
      // the list is empty up front, so we skip the list request entirely.
      let singleQuery = false
      // Bound the wait on the chart summary (fix F5). It is only an OPTIMIZATION
      // input (picks the single-query fast path + seeds the displayed count); the
      // windowed walk is correct without it. Blocking the list on a slow chart is
      // what produced the multi-second blank table.
      const chartSummary = await Promise.race([
        chartSummaryPromise,
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), CHART_SUMMARY_WAIT_MS)
        })
      ])
      if (callId !== loadCallId) return
      const applyChartTotal = (summary) => {
        if (!summary || summary.partialFilter || typeof summary.total !== 'number') return
        knownTotalCount = summary.total
        // Preserve single-writer-by-recency: setRecordsFound already guards
        // against clobbering a more-recent exact loadTotalCount result.
        if (summary.total > 0) setRecordsFound(summary.total)
      }
      if (chartSummary !== undefined) {
        applyChartTotal(chartSummary)
        if (chartSummary && !chartSummary.partialFilter && chartSummary.total === 0) {
          tableData.value = []
          recordsCount.value = 0
          hasMoreData.value = false
          return
        }
        if (chartSummary && !chartSummary.partialFilter && typeof chartSummary.total === 'number') {
          singleQuery = chartSummary.total <= SINGLE_QUERY_MAX_TOTAL
        }
      } else {
        // Chart was slow: don't block the list. Apply its total to the count when
        // it eventually resolves (guarded by callId so a superseded load never
        // writes). The list proceeds now via the windowed walk (still correct).
        chartSummaryPromise
          .then((late) => {
            if (callId !== loadCallId) return
            applyChartTotal(late)
          })
          .catch(() => {})
      }

      isShortRange = singleQuery || currentWindowEnd - originalBegin <= MAX_LIST_RANGE_MS
      const records = await fetchPage(pageSize.value, callId)
      if (callId !== loadCallId) return
      tableData.value = records
      // Numeric count end-to-end (design §2.1(5)): the displayed-count value is the
      // numeric ref directly. When not yet counted, preserve the old "—" parse-back
      // result (NaN, not null) so computeHasMoreData's isShortRange predicate is
      // unchanged.
      const totalNum = recordsCount.value == null ? NaN : recordsCount.value
      hasMoreData.value = computeHasMoreData({
        pageRecordsLength: records.length,
        accumulatedCount: records.length,
        knownTotalCount,
        isShortRange,
        currentWindowEnd,
        originalBegin,
        pageSize: pageSize.value,
        totalNum
      })
    } catch (error) {
      onError({ closable: true, severity: 'error', summary: 'Error', detail: error })
      recordsCount.value = null
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
        // REPLACE, never push+triggerRef: prop-crossing consumers (FieldSidebar
        // stats) only re-run when the array REFERENCE changes — an in-place push
        // keeps the prop identical and froze field stats at the first page.
        tableData.value = [...tableData.value, ...newRecords]
      }
      const originalBegin = new Date(filterData.value.tsRange.tsRangeBegin).getTime()
      hasMoreData.value = computeHasMoreData({
        pageRecordsLength: newRecords.length,
        accumulatedCount: tableData.value.length,
        knownTotalCount,
        isShortRange,
        currentWindowEnd,
        originalBegin,
        pageSize: pageSize.value
      })
    } catch (error) {
      onError({ closable: true, severity: 'error', summary: 'Error loading more', detail: error })
    } finally {
      isLoadingMore.value = false
    }
  }

  // ── setRecordsFound (chart-estimate writer, recency-guarded) ─────────
  // Public numeric writer for the single-writer-by-recency discipline (§2.1(5)):
  // an exact count wins over any estimate, partialFilter suppresses it, and
  // non-positive totals are ignored. The old @total-computed template bridge is gone.
  const setRecordsFound = (total) => {
    if (hasAccurateCount) return
    if (kpis.value?.partialFilter) return
    if (total <= 0) return
    recordsCount.value = total
    hasAccurateCount = true
  }

  return {
    tableData,
    chartData,
    kpis,
    recordsFound,
    isLoading,
    isChartLoading,
    chartHasError,
    hasMoreData,
    isLoadingMore,
    initialLoadDone,
    load,
    loadChart,
    loadMore,
    setRecordsFound
  }
}
