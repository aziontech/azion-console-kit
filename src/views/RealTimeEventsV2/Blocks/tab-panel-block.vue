<script setup>
  import { computed, nextTick, onBeforeMount, onMounted, onActivated, ref, watch } from 'vue'
  import { useRouteFilterManager } from '@/helpers'
  import { useToast } from '@aziontech/webkit/use-toast'
  import DetailSidebarPanel from './components/detail-sidebar-panel.vue'
  import EventChart from './components/event-chart.vue'
  import FieldSidebar from './components/field-sidebar.vue'
  import EventsSummaryBar from './components/events-summary-bar.vue'
  import ResizableSplitter from '@/components/Splitter/ResizableSplitter.vue'
  import DiscoverToolbar from './components/discover-toolbar.vue'
  import VirtualEventTable from './components/VirtualEventTable.vue'
  import QueryHistoryOverlay from './components/query-history-overlay.vue'
  import SavedSearchesOverlay from './components/saved-searches-overlay.vue'
  import LoadMoreFooter from './components/load-more-footer.vue'
  import FilterBar from './components/filter-bar.vue'
  import { getChartConfig } from './constants/chart-configs'
  import TABS_EVENTS from './constants/tabs-events'
  import { useAccountStore } from '@stores/account'
  import safeStructuredClone from '@/helpers/structured-clone'

  // Composables
  import { useQueryHistory } from '../composables/useQueryHistory'
  import { useSavedSearches } from '../composables/useSavedSearches'
  import { useDocumentSearch } from '../composables/useDocumentSearch'
  import { useDetailView } from '../composables/useDetailView'
  import { usePageSize, PAGE_SIZE_OPTIONS } from '../composables/usePageSize'
  import { useEventsData } from '../composables/useEventsData'
  import { useEventDataset } from '../composables/useEventDataset'
  import { useFilterActions } from '../composables/useFilterActions'
  import { useChartConfig } from '../composables/useChartConfig'
  import { useExportData } from '../composables/useExportData'
  import { useLegendFilter } from '../composables/useLegendFilter'
  import { useDatasetFields } from '../composables/useDatasetFields'
  import { useFieldResolution } from '../composables/useFieldResolution'
  import { useViewSync } from '../composables/useViewSync'
  import { useEventsExplorer } from '../composables/useEventsExplorer'
  import { useChartCollapse } from '../composables/useChartCollapse'
  import { useShareState } from '../composables/useShareState'
  import { useKeepAliveResource } from '@/composables/useKeepAliveResource'

  defineOptions({ name: 'TabPanelBlock' })
  const emit = defineEmits(['dataset-change'])
  const toast = useToast()

  const props = defineProps({
    listService: { type: Function },
    tabSelected: { type: Object },
    filterFields: { type: Array, default: () => [] },
    loadEventsChartAggregation: { type: Function, default: null },
    initialFilters: { type: Array, default: () => [] },
    hideDatasetSelector: { type: Boolean, default: false },
    metricsDashboards: { type: Array, default: () => [] },
    initialFilterState: { type: Object, default: null },
    initialPageSize: { type: [Number, String], default: null },
    initialSelectedFields: { type: Array, default: null },
    tabId: { type: String, default: null },
    activeTabId: { type: String, default: null },
    pendingViewState: { type: Object, default: null }
  })

  /* ── Composables ── */
  const { getFiltersFromHash, setFilterInHash } = useRouteFilterManager()
  const {
    history: queryHistory,
    removeQuery: removeQueryFromHistory,
    clearHistory: clearQueryHistory
  } = useQueryHistory()
  const { savedSearches, saveSearch, deleteSearch, localStorageAvailable } = useSavedSearches({
    // Fires at most once per composable instance — see useSavedSearches.
    onQuotaExceeded: () => {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'Saved searches unavailable in this session',
        detail: 'Storage quota exceeded or unavailable in this browser.',
        life: 4000
      })
    }
  })
  const { pageSize, setPageSize } = usePageSize()

  const filterData = ref(null)
  const selectedFields = ref([])
  const sidebarVisible = ref(typeof window !== 'undefined' ? window.innerWidth > 768 : true)
  const filterBarRef = ref(null)
  // Reactive gate for the events chart-aggregation co-fire (design §3.8). Mirrors
  // `isMetricsView`: under a metrics view the events chart isn't shown, so co-
  // firing it per list load is wasted; kept in sync by a watcher. Page-size
  // reloads additionally skip the chart via load({skipChart:true}).
  const suppressChartAgg = ref(false)

  const allDatasets = Object.values(TABS_EVENTS)
  const accountTimezone = computed(() => {
    try {
      return useAccountStore().accountData?.timezone || 'UTC'
    } catch {
      return 'UTC'
    }
  })
  const isTabSelected = computed(() => !!props.tabSelected?.tabRouter)

  const { fields: liveDatasetFields } = useDatasetFields(
    computed(() => props.tabSelected?.dataset || null)
  )

  const tsRangeBegin = computed(() => filterData.value?.tsRange?.tsRangeBegin || null)
  const tsRangeEnd = computed(() => filterData.value?.tsRange?.tsRangeEnd || null)

  const chartConfigKey = computed(() => props.tabSelected?.panel || null)
  const hasChartConfig = computed(() => {
    const cfg = chartConfigKey.value ? getChartConfig(chartConfigKey.value) : null
    return (
      chartConfigKey.value && cfg !== null && typeof props.loadEventsChartAggregation === 'function'
    )
  })

  const showChartSummary = computed(() => props.tabSelected?.showSummary ?? false)
  const chartStackByOptions = computed(() => props.tabSelected?.stackByOptions ?? [])
  const tabSupportsStacking = computed(() => props.tabSelected?.showStackBy ?? false)

  // Forwarding seam for the single reload entry (useEventsExplorer), which is
  // instantiated AFTER useChartConfig but needs to be callable by useViewSync's
  // intent callback + the watchers below. The holder is assigned once the explorer
  // exists; every call site funnels through it.
  const reload = (reason, payload) => reloadImpl(reason, payload)
  // Single-assignment seam (C6): reloadImpl is wired exactly once (after the
  // explorer exists). A second assignment throws to surface accidental re-wiring.
  let reloadImpl = () => {}
  let reloadImplWired = false
  const setReloadImpl = (fn) => {
    if (reloadImplWired) throw new Error('reloadImpl already assigned')
    reloadImpl = fn
    reloadImplWired = true
  }

  /* ── View sync — single writable View source of truth (design §3.6, task 9.4) ── */
  // `selectedView` is the ONLY writable view state; `stackByField`,
  // `selectedMetricsDashboard`, `isMetricsView` are read-only computeds from it.
  // A View change emits the parsed intent to the single reload seam (one list load
  // + one chart agg), killing the historical dual ownership that could desync.
  const { selectedView, isMetricsView, stackByField, selectedMetricsDashboard } = useViewSync({
    onIntent: (intent) => reload('view', { intent })
  })

  /* ── Events data ── */
  const {
    tableData,
    chartData,
    kpis: summaryKpis,
    recordsFound,
    isLoading,
    isChartLoading,
    chartHasError,
    hasMoreData,
    isLoadingMore,
    initialLoadDone,
    load: loadData,
    loadMore: loadMoreData
  } = useEventsData({
    filterData,
    listService: computed(() => props.listService),
    loadChartAggregation: computed(() => props.loadEventsChartAggregation),
    tabSelected: computed(() => props.tabSelected),
    pageSize,
    hasChartConfig,
    onError: (error) => toast.add(error),
    stackByField,
    suppressChartAgg
  })

  // NOTE: the former `watch(stackByField) -> loadChart()` is intentionally removed
  // (design §3.8, task 7.3). A stack-by change now rides the single `reload('view')`
  // path: the View intent sets `stackByField`, then one list load() co-fires the
  // chart agg once — eliminating the classic events-view double chart-agg.

  /* ── Dataset contract (design §2.1(2)(3)(4), §3.4) ── */
  // THE table data seam between the producer (`useEventsData`) and every rows
  // consumer: re-exposes the same `tableData` ref + id-keyed indexes + a single
  // `resetToken`. Eviction ENABLED (task 9.2, cap max(10×pageSize,5000)); id-keyed
  // search/stats keep the trim desync-free (design §2.1(3)/§7.4, P5).
  const dataset = useEventDataset({
    rows: tableData,
    hasMore: hasMoreData,
    pageSize: pageSize.value,
    evictionEnabled: true
  })

  // Release/rehydrate the dataset's reclaimable derived memory across keep-alive
  // (task 9.9, req 4.6). The tab panel is the SINGLE owner: release (deactivate/
  // unmount) drops the id-keyed indexes (the `rows` buffer survives); rehydrate
  // (activate/mount) reindexes before the onActivated reload guard runs.
  useKeepAliveResource(dataset.rehydrate, dataset.releaseReclaimable)

  /* ── Field resolution ── */
  const { availableFieldOptions } = useFieldResolution({
    filterFields: computed(() => props.filterFields),
    liveDatasetFields,
    selectedFields,
    tableData: dataset.rows,
    resetToken: dataset.resetToken
  })

  /* ── Document search ── */
  const {
    query: documentSearchQuery,
    debouncedQuery: debouncedSearchQuery,
    filteredData: filteredTableData,
    highlight: highlightText
  } = useDocumentSearch({ rows: dataset.rows, resetToken: dataset.resetToken })

  /* ── Detail view ── */
  const {
    mode: detailViewMode,
    activeRow: activeRowData,
    isLoading: isDetailLoading,
    sidebarVisible: detailSidebarVisible,
    expandedRows,
    isFullscreen,
    tableContainerRef,
    isRowActive,
    toggleMode: toggleDetailViewMode,
    selectRow,
    closeSidebar: closeDetailSidebar,
    navigate: navigateRow,
    getRowClass,
    handleKeyDown,
    resetSelection
  } = useDetailView(dataset.rows)

  /* ── Active-tab guard ── */
  // When tabId is null (pinned tab), it is active when activeTabId is also null/undefined.
  // When tabId is set, it is active when activeTabId matches.
  const isActiveTab = computed(() => {
    if (props.tabId === null) return props.activeTabId === null || props.activeTabId === undefined
    return String(props.activeTabId ?? '') === String(props.tabId ?? '')
  })

  /* ── Filter actions ── */
  const {
    refreshFilterData,
    reloadListTableWithHash: _reloadListTableWithHash,
    handleAddFilter,
    handleAddRangeFilter,
    handleExcludeFilter,
    handleRemoveFilter,
    pruneIncompatibleFilters,
    getHistoryParts
  } = useFilterActions({
    filterData,
    filterFields: computed(() => props.filterFields),
    tabSelected: computed(() => props.tabSelected),
    initialFilters: props.initialFilters,
    loadData,
    initialLoadDone,
    isLoading,
    onError: (error) => toast.add(error),
    getFiltersFromHash,
    setFilterInHash
  })

  // Gate: inactive tabs must not rewrite the URL hash.
  // When the tab is active (or there is no tab isolation), delegate to the
  // composable's implementation; otherwise just reload data in-memory.
  const reloadListTableWithHash = async () => {
    if (isActiveTab.value) {
      return _reloadListTableWithHash()
    }
    // Inactive tab: reload data without touching the URL hash
    loadData()
  }

  // When the dataset changes, its filter-field catalogue reloads. Drop any active
  // filter the new dataset doesn't support (e.g. `status` on Functions) and re-sync
  // the encoded `filters=` param + reload, else the stale filter leaks and the API
  // errors. Reference change of props.filterFields is the trigger.
  watch(
    () => props.filterFields,
    () => {
      if (pruneIncompatibleFilters()) {
        reload('prune')
      }
    }
  )

  // When the dataset changes, its metrics dashboards (View dropdown entries) change
  // too. If the selected metrics view no longer exists for the new dataset, fall
  // back to plain events, else the selector points at an orphaned option and the
  // chart shows stale metrics. Events views are never orphaned.
  watch(
    () => props.tabSelected?.panel,
    async () => {
      if (!isMetricsView.value) return
      await nextTick()
      const stillAvailable = metricsViewItemsFlat.value.some(
        (item) => item.value === selectedView.value
      )
      if (!stillAvailable) {
        selectedView.value = 'events:none'
      }
    }
  )

  /* ── Chart config ── */
  // `selectedMetricsDashboard` is INJECTED here as the read-only computed
  // derived from `selectedView` (owned by useViewSync, task 9.4). useChartConfig
  // and useMetricsChart consume it; neither owns the selection anymore.
  const {
    metricsChartData,
    isLoadingMetricsChart,
    metricsChartConfigKey,
    metricsChartPartial,
    hasMetricsDashboards,
    viewOptions,
    hasMultipleViewOptions,
    handleBrushSelect,
    reloadActiveMetrics,
    metricsViewItemsFlat
  } = useChartConfig({
    filterData,
    metricsDashboards: computed(() => props.metricsDashboards),
    filterSystemRef: computed(() => filterBarRef.value?.filterSystemRef || null),
    selectedMetricsDashboard,
    // handleBrushSelect (in useChartConfig) is the only consumer; route it through
    // the single reload seam as reason 'brush' so the events chart-agg is
    // suppressed under a metrics view. Metrics still reloads via the filterData
    // watch (tsRange mutation) — one metrics fetch, unchanged.
    reloadListTableWithHash: () => reload('brush'),
    eventsStackOptions: chartStackByOptions,
    supportsStacking: tabSupportsStacking,
    accountTimezone,
    onMetricsError: (err) => {
      const detailMap = {
        'schema-mismatch':
          'This chart is not available on the current account. Showing events instead.',
        'api-error': err?.detail || 'The server could not load this chart. Showing events instead.'
      }
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'Chart unavailable',
        detail: detailMap[err?.reason] || err?.message || 'Showing events instead.',
        life: 4500
      })
      // Single writable source: switching back to events is a `selectedView`
      // write; the derived controls follow automatically.
      selectedView.value = 'events:none'
    }
  })

  // Keep the events chart-agg suppression gate mirroring the active view kind.
  // `immediate` seeds it before the first load(); no reload is triggered here.
  watch(
    isMetricsView,
    (metrics) => {
      suppressChartAgg.value = metrics
    },
    { immediate: true }
  )

  /* ── Single reload seam (design §3.8/§7.5, task 7.3) ── */
  // `applyViewIntent` inside the seam writes the single writable `selectedView`
  // (task 9.4); the derived controls follow. `selectedMetricsDashboard` is
  // passed read-only only to decide the activate-time metrics nudge.
  const { reload: explorerReload } = useEventsExplorer({
    reloadListTableWithHash,
    loadData,
    reloadActiveMetrics,
    selectedView,
    selectedMetricsDashboard,
    // Fetch-only snapshot for the `activate` no-reload guard (task 9.6, req 4.14):
    // getCurrentShareState minus the CLIENT-ONLY documentQuery/selectedFields, so
    // a doc-search or field toggle no longer spuriously refetches on re-activation.
    getInputsSnapshot: () => getFetchInputsSnapshot()
  })
  setReloadImpl(explorerReload)

  /* ── Overlay refs ── */
  const queryHistoryOverlayRef = ref(null)
  const savedSearchOverlayRef = ref(null)
  const reloadListTable = () => loadData()

  const handleSaveSearch = (payload) => {
    // Overlay may emit either a plain string (legacy) or `{ name, description }`.
    const { name, description } =
      typeof payload === 'string' ? { name: payload, description: '' } : payload || {}
    const entry = saveSearch({
      name,
      filterData: filterData.value,
      selectedColumns: selectedFields.value,
      selectedFields: selectedFields.value,
      dataset: props.tabSelected?.dataset,
      pageSize: pageSize.value,
      description
    })
    // saveSearch returns undefined when the name is empty or account context
    // is missing — only confirm when something was actually persisted.
    if (entry) {
      toast.add({ closable: true, severity: 'success', summary: 'Search saved', life: 2000 })
    }
  }

  const handleLoadQueryHistory = (entry) => {
    if (entry.filterFields?.length && filterData.value)
      filterData.value = { ...filterData.value, fields: safeStructuredClone(entry.filterFields) }
    reload('query-history')
    queryHistoryOverlayRef.value?.hide()
  }

  const handleClearQueryHistory = () => {
    clearQueryHistory()
    queryHistoryOverlayRef.value?.hide()
  }

  const handleLoadSearch = (entry) => {
    if (!entry) return
    if (entry.filterData) filterData.value = safeStructuredClone(entry.filterData)
    // Prefer `selectedFields` (V2 spec field) when present and non-empty,
    // otherwise fall back to the legacy `selectedColumns` slot. Either may
    // exist on older persisted entries.
    const fieldsToRestore =
      (Array.isArray(entry.selectedFields) &&
        entry.selectedFields.length &&
        entry.selectedFields) ||
      (Array.isArray(entry.selectedColumns) &&
        entry.selectedColumns.length &&
        entry.selectedColumns)
    if (fieldsToRestore) selectedFields.value = [...fieldsToRestore]
    if (Number.isFinite(entry.pageSize) && entry.pageSize > 0) {
      pageSize.value = entry.pageSize
      setPageSize(entry.pageSize)
    }
    reload('saved-search')
    savedSearchOverlayRef.value?.hide()
  }

  const handlePageSizeChange = (val) => {
    pageSize.value = val
    setPageSize(val)
    reload('page-size')
  }

  const onRowClick = ({ originalEvent, data: rowData }) => {
    if (
      originalEvent?.target?.closest(
        '.log-badge__actions, .dynamic-field-actions, .expand-indicator'
      )
    )
      return
    selectRow(rowData)
  }

  const getFieldValue = (rowData, fieldName) => {
    const key = fieldName.replace('field_', '')
    // O(1) cell access via the dataset's id-keyed summary map (§3.4) when the row
    // is indexed. `.has` distinguishes "field absent" ('-') from a legitimately
    // falsy stored value, matching the previous array-scan semantics (found →
    // String(value); not found → '-').
    const id = rowData?.id
    if (id != null && dataset.hasId(id)) {
      const summaryMap = dataset.summaryMapOf(id)
      return summaryMap.has(key) ? String(summaryMap.get(key)) : '-'
    }
    // Fallback: row not (yet) indexed — scan its own summary array (unchanged
    // behavior, no regression for detached/transient rows).
    if (!Array.isArray(rowData.summary)) return '-'
    const entry = rowData.summary.find((item) => item.key === key)
    return entry ? String(entry.value) : '-'
  }

  const { handleLegendFilter } = useLegendFilter({ handleAddFilter, handleAddRangeFilter })

  // ── Chart collapse (fullscreen mode) ──
  const { isChartCollapsed, toggleCollapse } = useChartCollapse({ isFullscreen })

  const handleDatasetChange = (dataset) => emit('dataset-change', dataset)
  const datasetDropdownOptions = computed(() =>
    allDatasets.map((ds) => ({ label: ds.title, value: ds.panel }))
  )
  const onDatasetDropdownChange = (event) => {
    const selectedDataset = allDatasets.find((dataset) => dataset.panel === event.value)
    if (selectedDataset) emit('dataset-change', selectedDataset)
  }

  const { exportMenuItems, exportCsv } = useExportData({
    // JSON export + CSV fallback source (the retained rows), read through the
    // dataset seam.
    tableData: dataset.rows,
    tabSelected: computed(() => props.tabSelected),
    // ── ≤10k LOGICAL export wiring (design §2.1(9)/§3.7) ──
    // With these params the CSV export re-fetches the CURRENT range/filter up to
    // EXPORT_MAX_ROWS (newest→oldest) instead of reading the mounted virtual
    // window, so the export covers the logical result, not just what is on
    // screen / retained.
    listService: computed(() => props.listService),
    filterData: () => filterData.value,
    pageSize: () => pageSize.value,
    selectedFields: () => selectedFields.value,
    onWarn: ({ rows, cap }) =>
      toast.add({
        severity: 'warn',
        summary: 'Export truncated',
        detail: `The result has ${rows} rows; only the most recent ${cap} were exported.`,
        life: 5000
      })
  })
  const eventChartRef = ref(null)

  // When the detail sidebar opens or closes, the chart container width changes.
  // Trigger a resize after the DOM has settled so C3 fills the new width.
  watch(detailSidebarVisible, () => {
    nextTick(() => {
      setTimeout(() => {
        eventChartRef.value?.resize()
      }, 120)
    })
  })

  // Toggling the field sidebar reflows the splitter (panel-a is hidden via the
  // `splitter--sidebar-collapsed` class instead of being remounted). The chart
  // container width therefore changes without a mount, so nudge C3 to refit
  // after the DOM settles — a width safeguard, NOT a chart rebuild.
  watch(sidebarVisible, () => {
    nextTick(() => {
      eventChartRef.value?.resize()
    })
  })

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && isFullscreen.value) {
      event.preventDefault()
      isFullscreen.value = false
      return
    }
    handleKeyDown(event)
  }

  /**
   * Hydrate this tab from a Share_State payload on mount, from either
   * `pendingViewState` (new Events tab) or `initialFilterState`/`initialPageSize`/
   * `initialSelectedFields` (pinned tab). Called from `onBeforeMount` before
   * `refreshFilterData()`; also exposed for late Share_State (see TabsView).
   * @requires Requirements 1.5, N.2
   */
  const applyInitialShareState = () => {
    // pendingViewState takes priority (from useEventsTabs.getPendingViewState — Share_State import
    // into a new Events tab). Falls back to initialFilterState (direct prop injection).
    const stateToApply = props.pendingViewState || props.initialFilterState
    if (stateToApply && typeof stateToApply === 'object') {
      try {
        filterData.value = safeStructuredClone(stateToApply)
      } catch {
        /* ignore — falls back to whatever refreshFilterData() seeds */
      }
    }
    if (Array.isArray(props.initialSelectedFields))
      selectedFields.value = [...props.initialSelectedFields]
    if (props.initialPageSize) {
      const parsed = Number(props.initialPageSize)
      if (Number.isFinite(parsed) && parsed > 0) {
        pageSize.value = parsed
        setPageSize(parsed)
      }
    }
  }

  // Share_State projections: whole (share links) + fetch-only subset (activate
  // guard). See useShareState.
  const { getCurrentShareState, getFetchInputsSnapshot } = useShareState({
    filterData,
    pageSize,
    selectedFields,
    documentSearchQuery,
    selectedView,
    dataset: () => props.tabSelected?.panel || null
  })

  /* ── Lifecycle ── */
  // Keydown listener — SINGLE owner via useKeepAliveResource (task 7.6). One
  // acquire/release pair per live period across the mount + keep-alive paths,
  // guaranteed symmetric (no duplicate on re-activation, no leak on deactivate).
  // Replaces the four hand-rolled add/remove calls.
  useKeepAliveResource(
    () => {
      document.addEventListener('keydown', onKeyDown)
    },
    () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  )
  // NOTE: the `resetSeriesOrderCache()` lifecycle calls are removed — the series
  // order cache is now per-instance (`createSeriesOrderCache()` in
  // useChartBuilder, task 7.8), so there is no module singleton to reset and the
  // reset calls were dead (design §2.1(7)).

  onBeforeMount(() => {
    applyInitialShareState()
    refreshFilterData()
  })
  onMounted(async () => {
    await nextTick()
    filterBarRef.value?.filterSystemRef?.applyFilters()
    reload('mount')
  })
  onActivated(async () => {
    await nextTick()
    // SILENT tsRange re-resolve (no `updatedFilter` emit). The previous
    // unconditional applyFilters() routed EVERY reactivation through
    // reload('filter'), which skips the inputs-equality check and poisoned the
    // 'activate' guard below — every tab switch paid a fetch + aggregation.
    filterBarRef.value?.filterSystemRef?.refreshAppliedTimeRange?.()
    await nextTick()
    // Keep-alive re-activation funnels through the single reload seam (reason
    // 'activate'): in-memory reload + metrics nudge, but ONLY when reload-affecting
    // inputs changed (task 9.6, req 4.14; guard inside useEventsExplorer.reload).
    // A relative range re-resolves → snapshot differs → one reload; else zero fetches.
    reload('activate')
  })
  watch(isLoading, (loading, was) => {
    if (was && !loading) {
      resetSelection()
      if (dataset.rows.value.length > 0)
        filterBarRef.value?.filterSystemRef?.commitQueryToHistory?.()
    }
  })

  defineExpose({ reloadListTable, getCurrentShareState, applyInitialShareState })
</script>

<template>
  <div
    v-if="isTabSelected"
    class="flex flex-col flex-1 min-h-0 gap-3"
    :class="{
      'fixed inset-0 z-[100] bg-[var(--surface-ground)] p-2 overflow-auto tab-panel-root--fullscreen':
        isFullscreen
    }"
  >
    <!-- Filter bar -->
    <FilterBar
      ref="filterBarRef"
      :filterData="filterData"
      @update:filterData="filterData = $event"
      :filterFields="props.filterFields"
      :tabSelected="props.tabSelected"
      :hideDatasetSelector="hideDatasetSelector"
      :datasetOptions="datasetDropdownOptions"
      @filter-updated="() => reload('filter')"
      @remove-filter="handleRemoveFilter"
      @dataset-change="onDatasetDropdownChange"
      @open-saved-searches="(e) => savedSearchOverlayRef.toggle(e)"
    />

    <!-- Query History Overlay -->
    <QueryHistoryOverlay
      ref="queryHistoryOverlayRef"
      :history="queryHistory"
      :getHistoryParts="getHistoryParts"
      @load="handleLoadQueryHistory"
      @remove="removeQueryFromHistory"
      @clear="handleClearQueryHistory"
    />

    <!-- Saved Searches Overlay -->
    <SavedSearchesOverlay
      ref="savedSearchOverlayRef"
      :searches="savedSearches"
      :storageAvailable="localStorageAvailable"
      @load="handleLoadSearch"
      @delete="deleteSearch"
      @save="handleSaveSearch"
    />

    <!-- Main layout -->
    <div
      class="discover-layout"
      :class="{ 'discover-layout--fullscreen': isFullscreen }"
    >
      <div class="discover-layout__main">
        <ResizableSplitter
          direction="vertical"
          :initialTopPanelPixels="260"
          :minSize="[15, 50]"
          :maxSize="[30, 90]"
          :class="{ 'splitter--sidebar-collapsed': !sidebarVisible }"
        >
          <template #panel-a>
            <FieldSidebar
              :availableFields="availableFieldOptions"
              v-model:selectedFields="selectedFields"
              v-model:visible="sidebarVisible"
              :data="tableData"
              :resetToken="dataset.resetToken.value"
              :datasets="allDatasets"
              :selectedDataset="props.tabSelected"
              @add-filter="handleAddFilter"
              @update:selectedDataset="handleDatasetChange"
            />
          </template>
          <template #panel-b>
            <div class="flex flex-col h-full w-full min-h-0 min-w-0 overflow-hidden">
              <div
                v-if="hasChartConfig || hasMetricsDashboards"
                class="shrink-0 w-full"
              >
                <EventChart
                  ref="eventChartRef"
                  :data="isMetricsView ? metricsChartData : chartData"
                  :configKey="isMetricsView ? metricsChartConfigKey : chartConfigKey"
                  :tsRangeBegin="tsRangeBegin"
                  :tsRangeEnd="tsRangeEnd"
                  :isLoading="isMetricsView ? isLoadingMetricsChart : isChartLoading"
                  :hasError="!isMetricsView && chartHasError"
                  :chartDiverges="isMetricsView && metricsChartPartial"
                  :userTimezone="accountTimezone"
                  :stackBy="stackByField"
                  :view="selectedView"
                  :viewOptions="viewOptions"
                  :showView="hasMultipleViewOptions && tabSupportsStacking"
                  :showSummary="showChartSummary"
                  :collapsed="isChartCollapsed"
                  @update:view="selectedView = $event"
                  @brush-select="handleBrushSelect"
                  @legend-filter="handleLegendFilter"
                  @toggle-collapse="toggleCollapse"
                />
                <EventsSummaryBar
                  v-if="showChartSummary && !isChartCollapsed"
                  :kpis="summaryKpis"
                />
              </div>
              <DiscoverToolbar
                :sidebarVisible="sidebarVisible"
                :recordsFound="recordsFound"
                :documentSearchQuery="documentSearchQuery"
                :detailViewMode="detailViewMode"
                :isFullscreen="isFullscreen"
                :pageSize="pageSize"
                :pageSizeOptions="PAGE_SIZE_OPTIONS"
                :exportMenuItems="exportMenuItems"
                @update:sidebarVisible="sidebarVisible = $event"
                @update:documentSearchQuery="documentSearchQuery = $event"
                @update:isFullscreen="isFullscreen = $event"
                @toggle-detail-mode="toggleDetailViewMode"
                @page-size-change="handlePageSizeChange"
              />
              <div
                ref="tableContainerRef"
                class="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden outline-none"
                tabindex="0"
              >
                <VirtualEventTable
                  :data="filteredTableData"
                  :selectedFields="selectedFields"
                  :expandedRows="expandedRows"
                  @update:expandedRows="expandedRows = $event"
                  :detailViewMode="detailViewMode"
                  :isLoading="isLoading"
                  :isDetailLoading="isDetailLoading"
                  :exportCsv="exportCsv"
                  :resetToken="dataset.resetToken.value"
                  :rowClass="getRowClass"
                  :debouncedSearchQuery="debouncedSearchQuery"
                  :dataset="props.tabSelected.dataset"
                  :highlightText="highlightText"
                  :isRowActive="isRowActive"
                  :getFieldValue="getFieldValue"
                  @row-click="onRowClick"
                  @select-row="selectRow"
                  @add-filter="handleAddFilter"
                  @exclude-filter="handleExcludeFilter"
                  @notify="(payload) => toast.add(payload)"
                />
              </div>
              <LoadMoreFooter
                :isLoadingMore="isLoadingMore"
                :hasMoreData="hasMoreData"
                :tableLength="tableData.length"
                :recordsFound="recordsFound"
                :pageSize="pageSize"
                @load-more="loadMoreData"
              />
            </div>
          </template>
        </ResizableSplitter>
      </div>
      <DetailSidebarPanel
        v-if="detailViewMode === 'sidebar'"
        :visible="detailSidebarVisible"
        :data="activeRowData"
        :isLoading="isDetailLoading"
        @add-filter="handleAddFilter"
        @exclude-filter="handleExcludeFilter"
        @close="closeDetailSidebar"
        @navigate="navigateRow"
      />
    </div>
  </div>
</template>

<style scoped>
  .discover-layout {
    display: flex;
    align-items: stretch;
    flex: 1;
    min-height: 300px;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    overflow: hidden;
    background: var(--surface-card);
  }
  .discover-layout__main {
    display: flex;
    flex: 1 1 0%;
    min-width: 0;
    overflow: hidden;
  }
  .discover-layout__main > :deep(.resizable-splitter) {
    flex: 1 1 0%;
    width: auto !important;
    min-width: 0;
  }
  .discover-layout--fullscreen {
    flex: 1;
    border: none;
    border-radius: 0;
  }
  /* Fullscreen root: respect iOS safe-area insets, fill the visible viewport,
     and enable momentum scrolling on iOS Safari. */
  .tab-panel-root--fullscreen {
    /* Fallback for browsers without `dvh` support (pre-2022 iOS Safari). */
    height: 100vh;
    height: 100dvh;
    padding-top: max(0.5rem, env(safe-area-inset-top));
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
    padding-left: max(0.5rem, env(safe-area-inset-left));
    padding-right: max(0.5rem, env(safe-area-inset-right));
    -webkit-overflow-scrolling: touch;
  }
  :deep(.discover-layout .panel-a) {
    background: var(--surface-ground);
  }
  :deep(.splitter--sidebar-collapsed .panel-a),
  :deep(.splitter--sidebar-collapsed .handle) {
    display: none !important;
  }
  :deep(.field-sidebar) {
    border-right: none;
  }
  :deep(.resizable-splitter > .handle) {
    width: 0.375rem !important;
  }
  :deep(.events-chart-group .event-chart-wrapper) {
    border: none;
    border-radius: 0;
    margin-bottom: 0;
  }
  /* On narrow viewports the splitter HANDLE (drag bar) is hidden — touch users
     can toggle the field sidebar via the "Fields" button in `discover-toolbar`
     instead. The sidebar itself stays controllable by the JS `sidebarVisible`
     state, so the user can opt-in to seeing fields on mobile if they want. */
  @media (max-width: 639px) {
    :deep(.resizable-splitter > .handle) {
      display: none !important;
    }
    .discover-layout {
      min-height: 200px;
    }
    /* Fields as an overlay drawer: side-by-side split on a phone squeezes the
       chart/table into ~40% width (overlapping ticks, cramped header). The
       drawer leaves the main area full-width; the X button still closes it.
       !important beats the splitter's inline pixel width. */
    .discover-layout__main {
      position: relative;
    }
    :deep(.resizable-splitter > .panel-a) {
      position: absolute;
      inset-block: 0;
      left: 0;
      z-index: 20;
      width: min(85vw, 320px) !important;
      background: var(--surface-ground);
      border-right: 1px solid var(--surface-border);
      box-shadow: var(--shadow-xl);
    }
  }

  /* Chart collapse — same visual pattern as EventsSummaryBar */
</style>
