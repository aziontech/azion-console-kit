<script setup>
  import {
    computed,
    nextTick,
    onBeforeMount,
    onBeforeUnmount,
    onMounted,
    onActivated,
    onDeactivated,
    ref,
    watch
  } from 'vue'
  import { useRouteFilterManager } from '@/helpers'
  import { useToast } from '@aziontech/webkit/use-toast'
  import DetailSidebarPanel from './components/detail-sidebar-panel.vue'
  import EventChart from './components/event-chart.vue'
  import FieldSidebar from './components/field-sidebar.vue'
  import EventsSummaryBar from './components/events-summary-bar.vue'
  import ResizableSplitter from '@/components/Splitter/ResizableSplitter.vue'
  import DiscoverToolbar from './components/discover-toolbar.vue'
  import DiscoverDataTable from './components/discover-data-table.vue'
  import QueryHistoryOverlay from './components/query-history-overlay.vue'
  import SavedSearchesOverlay from './components/saved-searches-overlay.vue'
  import LoadMoreFooter from './components/load-more-footer.vue'
  import FilterBar from './components/filter-bar.vue'
  import { getChartConfig } from './constants/chart-configs'
  import TABS_EVENTS from './constants/tabs-events'
  import { useAccountStore } from '@stores/account'
  import { resetSeriesOrderCache } from '../composables/useChartBuilder'
  import safeStructuredClone from '@/helpers/structured-clone'

  // Composables
  import { useQueryHistory } from '../composables/useQueryHistory'
  import { useSavedSearches } from '../composables/useSavedSearches'
  import { useDocumentSearch } from '../composables/useDocumentSearch'
  import { useDetailView } from '../composables/useDetailView'
  import { usePageSize, PAGE_SIZE_OPTIONS } from '../composables/usePageSize'
  import { useEventsData } from '../composables/useEventsData'
  import { useFilterActions } from '../composables/useFilterActions'
  import { useChartConfig } from '../composables/useChartConfig'
  import { useExportData } from '../composables/useExportData'
  import { useLegendFilter } from '../composables/useLegendFilter'
  import { useDatasetFields } from '../composables/useDatasetFields'
  import { useFieldResolution } from '../composables/useFieldResolution'
  import { useViewSync } from '../composables/useViewSync'

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
    initialSelectedFields: { type: Array, default: null }
  })

  /* ── Composables ── */
  const { getFiltersFromHash, setFilterInHash } = useRouteFilterManager()
  const { history: queryHistory, removeQuery: removeQueryFromHistory, clearHistory: clearQueryHistory } = useQueryHistory()
  const { savedSearches, saveSearch, deleteSearch } = useSavedSearches()
  const { pageSize, setPageSize } = usePageSize()

  const filterData = ref(null)
  const selectedFields = ref([])
  const sidebarVisible = ref(typeof window !== 'undefined' ? window.innerWidth > 768 : true)
  const filterBarRef = ref(null)
  const stackByField = ref('none')

  const allDatasets = Object.values(TABS_EVENTS)
  const accountTimezone = computed(() => {
    try { return useAccountStore().accountData?.timezone || 'UTC' } catch { return 'UTC' }
  })
  const isTabSelected = computed(() => !!props.tabSelected?.tabRouter)

  const { fields: liveDatasetFields } = useDatasetFields(computed(() => props.tabSelected?.dataset || null))

  const tsRangeBegin = computed(() => filterData.value?.tsRange?.tsRangeBegin || null)
  const tsRangeEnd = computed(() => filterData.value?.tsRange?.tsRangeEnd || null)

  const chartConfigKey = computed(() => props.tabSelected?.panel || null)
  const hasChartConfig = computed(() => {
    const cfg = chartConfigKey.value ? getChartConfig(chartConfigKey.value) : null
    return chartConfigKey.value && cfg !== null && typeof props.loadEventsChartAggregation === 'function'
  })

  const showChartSummary = computed(() => props.tabSelected?.showSummary ?? false)
  const chartStackByOptions = computed(() => props.tabSelected?.stackByOptions ?? [])
  const tabSupportsStacking = computed(() => props.tabSelected?.showStackBy ?? false)

  /* ── Events data ── */
  const {
    tableData, chartData, kpis: summaryKpis, recordsFound, isLoading, isChartLoading,
    hasMoreData, isLoadingMore, initialLoadDone, load: loadData, loadChart,
    loadMore: loadMoreData, setRecordsFound
  } = useEventsData({
    filterData, listService: computed(() => props.listService),
    loadChartAggregation: computed(() => props.loadEventsChartAggregation),
    tabSelected: computed(() => props.tabSelected), pageSize, hasChartConfig,
    onError: (error) => toast.add(error), stackByField
  })

  watch(stackByField, () => { if (hasChartConfig.value) loadChart() })

  /* ── Field resolution ── */
  const { availableFieldOptions } = useFieldResolution({
    filterFields: computed(() => props.filterFields), liveDatasetFields, selectedFields, tableData
  })

  /* ── Document search ── */
  const {
    query: documentSearchQuery, debouncedQuery: debouncedSearchQuery,
    filteredData: filteredTableData, highlight: highlightText
  } = useDocumentSearch(tableData)

  /* ── Detail view ── */
  const {
    mode: detailViewMode, activeRow: activeRowData, isLoading: isDetailLoading,
    sidebarVisible: detailSidebarVisible, expandedRows, isFullscreen, tableContainerRef,
    isRowActive, toggleMode: toggleDetailViewMode, selectRow, closeSidebar: closeDetailSidebar,
    navigate: navigateRow, getRowClass, handleKeyDown, resetSelection
  } = useDetailView(tableData)

  /* ── Filter actions ── */
  const {
    refreshFilterData, reloadListTableWithHash, handleAddFilter, handleAddRangeFilter,
    handleExcludeFilter, handleRemoveFilter, getHistoryParts
  } = useFilterActions({
    filterData, filterFields: computed(() => props.filterFields),
    tabSelected: computed(() => props.tabSelected), initialFilters: props.initialFilters,
    loadData, initialLoadDone, isLoading, onError: (error) => toast.add(error),
    getFiltersFromHash, setFilterInHash
  })

  /* ── Chart config ── */
  const {
    metricsChartData, isLoadingMetricsChart, metricsChartConfigKey, selectedMetricsDashboard,
    hasMetricsDashboards, viewOptions, hasMultipleViewOptions, handleBrushSelect
  } = useChartConfig({
    filterData, metricsDashboards: computed(() => props.metricsDashboards),
    filterSystemRef: computed(() => filterBarRef.value?.filterSystemRef || null),
    reloadListTableWithHash, eventsStackOptions: chartStackByOptions,
    supportsStacking: tabSupportsStacking,
    accountTimezone,
    onMetricsError: (err) => {
      const detailMap = {
        'schema-mismatch': 'This chart is not available on the current account. Showing events instead.',
        'api-error': err?.detail || 'The server could not load this chart. Showing events instead.'
      }
      toast.add({
        closable: true, severity: 'warn', summary: 'Chart unavailable',
        detail: detailMap[err?.reason] || err?.message || 'Showing events instead.', life: 4500
      })
      selectedView.value = 'events:none'
    }
  })

  /* ── View sync ── */
  const { selectedView, isMetricsView } = useViewSync({
    selectedMetricsDashboard, stackByField, reloadListTableWithHash
  })

  /* ── Overlay refs ── */
  const queryHistoryOverlayRef = ref(null)
  const savedSearchOverlayRef = ref(null)
  const reloadListTable = () => loadData()

  const handleSaveSearch = (name) => {
    saveSearch({
      name, filterData: filterData.value,
      selectedColumns: selectedFields.value, dataset: props.tabSelected?.dataset
    })
    toast.add({ closable: true, severity: 'success', summary: 'Search saved', life: 2000 })
  }

  const handleLoadQueryHistory = (entry) => {
    if (entry.filterFields?.length && filterData.value)
      filterData.value = { ...filterData.value, fields: safeStructuredClone(entry.filterFields) }
    reloadListTableWithHash()
    queryHistoryOverlayRef.value?.hide()
  }

  const handleClearQueryHistory = () => {
    clearQueryHistory()
    queryHistoryOverlayRef.value?.hide()
  }

  const handleLoadSearch = (entry) => {
    if (entry.filterData) filterData.value = safeStructuredClone(entry.filterData)
    if (entry.selectedColumns?.length) selectedFields.value = [...entry.selectedColumns]
    reloadListTableWithHash()
    savedSearchOverlayRef.value?.hide()
  }

  const handlePageSizeChange = (val) => {
    pageSize.value = val
    setPageSize(val)
    loadData()
  }

  const onRowClick = ({ originalEvent, data: rowData }) => {
    if (originalEvent?.target?.closest('.log-badge__actions, .dynamic-field-actions, .expand-indicator')) return
    selectRow(rowData)
  }

  const getFieldValue = (rowData, fieldName) => {
    const key = fieldName.replace('field_', '')
    if (!Array.isArray(rowData.summary)) return '-'
    const entry = rowData.summary.find((item) => item.key === key)
    return entry ? String(entry.value) : '-'
  }

  const { handleLegendFilter } = useLegendFilter({ handleAddFilter, handleAddRangeFilter })

  // ── Chart collapse (fullscreen mode) ─────────────────────────────────
  // In fullscreen the chart is collapsed by default to maximise table space.
  // The user can expand it again via the toggle button in the chart header.
  const CHART_COLLAPSE_KEY = 'rte:chart-collapsed'
  const isChartCollapsed = ref(false)
  try {
    if (localStorage.getItem(CHART_COLLAPSE_KEY) === '1') isChartCollapsed.value = true
  } catch { /* ignore */ }
  watch(isChartCollapsed, (val) => {
    try { localStorage.setItem(CHART_COLLAPSE_KEY, val ? '1' : '0') } catch { /* ignore */ }
  })
  watch(isFullscreen, (val) => { isChartCollapsed.value = val })
  const handleDatasetChange = (dataset) => emit('dataset-change', dataset)
  const datasetDropdownOptions = computed(() =>
    allDatasets.map((ds) => ({ label: ds.title, value: ds.panel }))
  )
  const onDatasetDropdownChange = (event) => {
    const selectedDataset = allDatasets.find((dataset) => dataset.panel === event.value)
    if (selectedDataset) emit('dataset-change', selectedDataset)
  }

  const { dataTableRef, exportMenuItems, exportFunctionMapper } =
    useExportData({ tableData, tabSelected: computed(() => props.tabSelected) })
  const discoverDataTableRef = ref(null)
  // Sync the dataTableRef from useExportData to the inner DataTable via the sub-component
  watch(() => discoverDataTableRef.value?.dataTableRef, (inner) => { dataTableRef.value = inner ?? null }, { flush: 'post' })

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && isFullscreen.value) {
      event.preventDefault()
      isFullscreen.value = false
      return
    }
    handleKeyDown(event)
  }

  const applyInitialShareState = () => {
    if (props.initialFilterState && typeof props.initialFilterState === 'object') {
      try { filterData.value = safeStructuredClone(props.initialFilterState) } catch { /* ignore */ }
    }
    if (Array.isArray(props.initialSelectedFields)) selectedFields.value = [...props.initialSelectedFields]
    if (props.initialPageSize) {
      const parsed = Number(props.initialPageSize)
      if (Number.isFinite(parsed) && parsed > 0) { pageSize.value = parsed; setPageSize(parsed) }
    }
  }

  const getCurrentShareState = () => ({
    filters: filterData.value ? safeStructuredClone(filterData.value) : null,
    dataset: props.tabSelected?.panel || null, pageSize: pageSize.value,
    selectedFields: [...selectedFields.value], documentQuery: documentSearchQuery.value || ''
  })

  /* ── Lifecycle ── */
  onBeforeMount(() => { applyInitialShareState(); refreshFilterData() })
  onMounted(async () => {
    document.addEventListener('keydown', onKeyDown)
    await nextTick()
    filterBarRef.value?.filterSystemRef?.applyFilters()
    loadData()
  })
  onBeforeUnmount(() => { document.removeEventListener('keydown', onKeyDown); resetSeriesOrderCache() })
  onDeactivated(() => { document.removeEventListener('keydown', onKeyDown); resetSeriesOrderCache() })
  onActivated(async () => {
    document.addEventListener('keydown', onKeyDown)
    await nextTick()
    filterBarRef.value?.filterSystemRef?.applyFilters()
    await nextTick()
    loadData()
  })
  watch(isLoading, (loading, was) => {
    if (was && !loading) {
      resetSelection()
      if (tableData.value.length > 0) filterBarRef.value?.filterSystemRef?.commitQueryToHistory?.()
    }
  })

  defineExpose({ reloadListTable, getCurrentShareState, applyInitialShareState })
</script>

<template>
  <div
    v-if="isTabSelected"
    class="flex flex-col flex-1 min-h-0 gap-3"
    :class="{
      'fixed inset-0 z-[100] bg-[var(--surface-ground)] p-2 overflow-auto': isFullscreen
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
      @filter-updated="reloadListTableWithHash"
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
      @load="handleLoadSearch"
      @delete="deleteSearch"
      @save="handleSaveSearch"
    />

    <!-- Main layout -->
    <div class="discover-layout" :class="{ 'discover-layout--fullscreen': isFullscreen }">
      <ResizableSplitter
        direction="vertical"
        :initialTopPanelPixels="260"
        :minSize="[15, 50]"
        :maxSize="[30, 90]"
        :class="{ 'splitter--sidebar-collapsed': !sidebarVisible }"
        :key="String(sidebarVisible)"
      >
        <template #panel-a>
          <FieldSidebar
            :availableFields="availableFieldOptions"
            v-model:selectedFields="selectedFields"
            v-model:visible="sidebarVisible"
            :data="tableData"
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
                :data="isMetricsView ? metricsChartData : chartData"
                :configKey="isMetricsView ? metricsChartConfigKey : chartConfigKey"
                :tsRangeBegin="tsRangeBegin"
                :tsRangeEnd="tsRangeEnd"
                :isLoading="isMetricsView ? isLoadingMetricsChart : isChartLoading"
                :userTimezone="accountTimezone"
                :stackBy="stackByField"
                :view="selectedView"
                :viewOptions="viewOptions"
                :showView="hasMultipleViewOptions"
                :showSummary="showChartSummary"
                :collapsed="isChartCollapsed"
                @update:view="selectedView = $event"
                @brush-select="handleBrushSelect"
                @legend-filter="handleLegendFilter"
                @total-computed="setRecordsFound"
                @toggle-collapse="isChartCollapsed = !isChartCollapsed"
              />
              <EventsSummaryBar
                v-if="showChartSummary && !isMetricsView && !isChartCollapsed"
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
              <DiscoverDataTable
                ref="discoverDataTableRef"
                :data="filteredTableData"
                :selectedFields="selectedFields"
                :expandedRows="expandedRows"
                @update:expandedRows="expandedRows = $event"
                :detailViewMode="detailViewMode"
                :isLoading="isLoading"
                :isDetailLoading="isDetailLoading"
                :exportFilename="`${props.tabSelected.tabRouter}-logs`"
                :exportFunction="exportFunctionMapper"
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
      <DetailSidebarPanel
        v-if="detailViewMode === 'sidebar'"
        :visible="detailSidebarVisible"
        :data="activeRowData"
        :isLoading="isDetailLoading"
        :onAddFilter="handleAddFilter"
        :onExcludeFilter="handleExcludeFilter"
        @close="closeDetailSidebar"
        @navigate="navigateRow"
      />
    </div>
  </div>
</template>


<style scoped>
  .discover-layout {
    display: flex; align-items: stretch; flex: 1; min-height: 300px;
    border: 1px solid var(--surface-border); border-radius: var(--border-radius);
    overflow: hidden; background: var(--surface-card);
  }
  .discover-layout--fullscreen { flex: 1; border: none; border-radius: 0; }
  :deep(.discover-layout .panel-a) { background: var(--surface-ground); }
  :deep(.splitter--sidebar-collapsed .panel-a),
  :deep(.splitter--sidebar-collapsed .handle) { display: none !important; }
  :deep(.field-sidebar) { border-right: none; }
  :deep(.resizable-splitter > .handle) { width: 0.375rem !important; }
  :deep(.events-chart-group .event-chart-wrapper) { border: none; border-radius: 0; margin-bottom: 0; }
  @media (max-width: 768px) {
    :deep(.resizable-splitter > .panel-a) { display: none !important; }
    :deep(.resizable-splitter > .handle) { display: none !important; }
    .discover-layout { min-height: 200px; }
  }

  /* Chart collapse — same visual pattern as EventsSummaryBar */
</style>
