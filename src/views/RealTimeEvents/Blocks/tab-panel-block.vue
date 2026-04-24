<script setup>
  import {
    computed,
    nextTick,
    onBeforeMount,
    onBeforeUnmount,
    onMounted,
    onActivated,
    ref,
    watch
  } from 'vue'
  import DataTable from '@aziontech/webkit/datatable'
  import Column from '@aziontech/webkit/column'
  import AdvancedFilterSystem from '@/components/base/advanced-filter-system/index.vue'
  import FilterTagsDisplay from '@/components/base/advanced-filter-system/filterTagsDisplay'
  import { useRouteFilterManager, eventsPlaygroundOpener } from '@/helpers'
  import PrimeButton from '@aziontech/webkit/button'
  import Skeleton from '@aziontech/webkit/skeleton'
  import Menu from '@aziontech/webkit/menu'
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import InputText from '@aziontech/webkit/inputtext'
  import Dropdown from '@aziontech/webkit/dropdown'
  import { useToast } from '@aziontech/webkit/use-toast'
  import EventDocumentView from './components/event-document-view.vue'
  import DetailSidebarPanel from './components/detail-sidebar-panel.vue'
  import EventChart from './components/event-chart.vue'
  import FieldSidebar from './components/field-sidebar.vue'
  import EventsSummaryBar from './components/events-summary-bar.vue'
  import LogFieldBadges from './components/log-field-badges.vue'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import ResizableSplitter from '@/components/Splitter/ResizableSplitter.vue'
  import { getChartConfig } from './constants/chart-configs'
  import TABS_EVENTS from './constants/tabs-events'
  import { useAccountStore } from '@stores/account'
  import { resetSeriesOrderCache } from '../composables/useChartBuilder'

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
  import { parseViewValue } from '../composables/useChartConfig'
  import { useDatasetFields } from '../composables/useDatasetFields'
  import { AGGREGATION_OPERATORS } from '@/services/real-time-events-service/_shared/aggregation-operators'

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
    // Initial state injected from a shared URL (shareState). Applied once on mount.
    initialFilterState: { type: Object, default: null },
    initialPageSize: { type: [Number, String], default: null },
    initialSelectedFields: { type: Array, default: null }
  })

  /* ── Composables ── */
  const { getFiltersFromHash, setFilterInHash } = useRouteFilterManager()
  const {
    history: queryHistory,
    removeQuery: removeQueryFromHistory,
    clearHistory: clearQueryHistory
  } = useQueryHistory()
  const { savedSearches, saveSearch, deleteSearch } = useSavedSearches()
  const { pageSize, setPageSize } = usePageSize()

  const filterData = ref(null)
  const selectedFields = ref([])
  const sidebarVisible = ref(typeof window !== 'undefined' ? window.innerWidth > 768 : true)
  const filterSystemRef = ref(null)
  // Unified "View" selection. Encodes both families:
  //   'events:<stackBy>'   → Events histogram ('none' | 'status' | 'requestMethod')
  //   'metrics:<key>'      → Metrics timeseries ('wafThreats' | 'botTraffic' | ...)
  // `stackByField` is a derived value kept as its own ref because the Events
  // loader (useEventsData) already consumes it and expects plain strings.
  const selectedView = ref('events:none')
  const stackByField = ref('none')

  const allDatasets = Object.values(TABS_EVENTS)
  const accountTimezone = computed(() => {
    try {
      return useAccountStore().accountData?.timezone || 'UTC'
    } catch {
      return 'UTC'
    }
  })
  const isTabSelected = computed(() => !!props.tabSelected?.tabRouter)

  // Reactive dataset field list: curated baseline until introspection
  // resolves, then the live schema's exact field names. Using this single
  // source for `availableFields` eliminates the stale-casing duplicates the
  // curated constant (e.g. `sessionId`) used to produce alongside the live
  // payload keys (e.g. `sessionid`).
  const { fields: liveDatasetFields } = useDatasetFields(
    computed(() => props.tabSelected?.dataset || null)
  )

  const availableFieldOptions = computed(() => {
    const byKey = new Map() // lowercase → { display, preferred }

    const add = (value, preferred = false) => {
      if (!value) return
      const display = String(value)
      if (AGGREGATION_OPERATORS.has(display)) return
      const key = display.toLowerCase()
      const existing = byKey.get(key)
      if (!existing || (preferred && !existing.preferred)) {
        byKey.set(key, { display, preferred })
      }
    }

    ;(props.filterFields || []).forEach((field) => add(field?.value))
    ;(liveDatasetFields.value || []).forEach((field) => add(field))
    selectedFields.value.forEach((field) => add(field))

    // Row-discovered names win because they reflect what the backend actually
    // emits, including any casing drift vs the curated docs list.
    tableData.value.forEach((row) => {
      const summary = Array.isArray(row?.summary)
        ? row.summary
        : Array.isArray(row?.data)
          ? row.data
          : []
      summary.forEach((entry) => add(entry?.key, /* preferred */ true))
    })

    return Array.from(byKey.values())
      .map((entry) => entry.display)
      .sort((left, right) => left.localeCompare(right))
      .map((field) => ({ label: field, value: field }))
  })
  const tsRangeBegin = computed(() => filterData.value?.tsRange?.tsRangeBegin || null)
  const tsRangeEnd = computed(() => filterData.value?.tsRange?.tsRangeEnd || null)

  const chartConfigKey = computed(() => props.tabSelected?.panel || null)
  const hasChartConfig = computed(() => {
    const cfg = chartConfigKey.value ? getChartConfig(chartConfigKey.value) : null
    return (
      chartConfigKey.value && cfg !== null && typeof props.loadEventsChartAggregation === 'function'
    )
  })

  // Chart display options from tab config
  const showChartSummary = computed(() => props.tabSelected?.showSummary ?? false)
  const chartStackByOptions = computed(() => props.tabSelected?.stackByOptions ?? [])
  const tabSupportsStacking = computed(() => props.tabSelected?.showStackBy ?? false)

  /* ── Events data ── */
  const {
    tableData,
    chartData,
    kpis: summaryKpis,
    recordsFound,
    isLoading,
    isChartLoading,
    hasMoreData,
    isLoadingMore,
    initialLoadDone,
    load: loadData,
    loadChart,
    loadMore: loadMoreData,
    setRecordsFound
  } = useEventsData({
    filterData,
    listService: computed(() => props.listService),
    loadChartAggregation: computed(() => props.loadEventsChartAggregation),
    tabSelected: computed(() => props.tabSelected),
    pageSize,
    hasChartConfig,
    toast,
    stackByField
  })

  // Re-fetch only the chart (not the table) when the user changes the stack.
  watch(stackByField, () => {
    if (hasChartConfig.value) loadChart()
  })

  /* ── Document search ── */
  const {
    query: documentSearchQuery,
    debouncedQuery: debouncedSearchQuery,
    filteredData: filteredTableData,
    highlight: highlightText
  } = useDocumentSearch(tableData)

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
  } = useDetailView(tableData)

  /* ── Filter actions (composable) ── */
  const {
    refreshFilterData,
    reloadListTableWithHash,
    handleAddFilter,
    handleAddRangeFilter,
    handleExcludeFilter,
    handleRemoveFilter,
    getHistoryParts
  } = useFilterActions({
    filterData,
    filterFields: computed(() => props.filterFields),
    tabSelected: computed(() => props.tabSelected),
    initialFilters: props.initialFilters,
    loadData,
    initialLoadDone,
    isLoading,
    toast,
    getFiltersFromHash,
    setFilterInHash
  })

  /* ── Chart config (composable) ── */
  const {
    metricsChartData,
    isLoadingMetricsChart,
    metricsChartConfigKey,
    selectedMetricsDashboard,
    hasMetricsDashboards,
    viewOptions,
    hasMultipleViewOptions,
    handleBrushSelect
  } = useChartConfig({
    filterData,
    metricsDashboards: computed(() => props.metricsDashboards),
    filterSystemRef,
    reloadListTableWithHash,
    eventsStackOptions: chartStackByOptions,
    supportsStacking: tabSupportsStacking,
    // Surface metrics chart failures (schema mismatch, API errors) as a
    // user-friendly toast and fall back to the Events view so the user can
    // keep investigating.
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
      // Fallback to events default so the main total/Events chart re-appears.
      selectedView.value = 'events:none'
    }
  })

  /* ── Unified View selector wiring ──
   * Sync `selectedView` → internal state (`stackByField` for Events loader,
   * `selectedMetricsDashboard` for Metrics loader). Single source of truth
   * replaces the two legacy controls (Stack by + Metrics top dropdown).
   */
  watch(selectedView, (value) => {
    const { scheme, key } = parseViewValue(value)
    if (scheme === 'events') {
      if (selectedMetricsDashboard.value) selectedMetricsDashboard.value = null
      stackByField.value = key || 'none'
    } else {
      stackByField.value = 'none'
      selectedMetricsDashboard.value = key
    }
    // Re-fetch the events list so the documents table reflects the active
    // view (stack-by change or metrics chart selection). Keeps the left-side
    // counter and the table in sync with what the chart is showing.
    reloadListTableWithHash()
  })

  // Chart kind currently showing — used to toggle KPI bar and pick the chart
  // data source in the template.
  const isMetricsView = computed(() => parseViewValue(selectedView.value).scheme === 'metrics')

  /* ── Overlay refs ── */
  const queryHistoryOverlayRef = ref(null)
  const savedSearchOverlayRef = ref(null)
  const saveSearchName = ref('')

  /* ── Actions ── */
  const reloadListTable = () => loadData()

  const handleSaveSearch = () => {
    if (!saveSearchName.value.trim()) return
    saveSearch({
      name: saveSearchName.value,
      filterData: filterData.value,
      selectedColumns: selectedFields.value,
      dataset: props.tabSelected?.dataset
    })
    saveSearchName.value = ''
    toast.add({ closable: true, severity: 'success', summary: 'Search saved', life: 2000 })
  }

  const handleLoadQueryHistory = (entry) => {
    if (entry.filterFields?.length && filterData.value)
      filterData.value = {
        ...filterData.value,
        fields: JSON.parse(JSON.stringify(entry.filterFields))
      }
    reloadListTableWithHash()
  }

  const handleLoadQueryHistoryAndClose = (entry) => {
    handleLoadQueryHistory(entry)
    queryHistoryOverlayRef.value?.hide()
  }

  const handleClearQueryHistory = () => {
    clearQueryHistory()
    queryHistoryOverlayRef.value?.hide()
  }

  const handleLoadSearch = (entry) => {
    if (entry.filterData) filterData.value = JSON.parse(JSON.stringify(entry.filterData))
    if (entry.selectedColumns?.length) selectedFields.value = [...entry.selectedColumns]
    reloadListTableWithHash()
  }

  const handleLoadSearchAndClose = (entry) => {
    handleLoadSearch(entry)
    savedSearchOverlayRef.value?.hide()
  }

  const handlePageSizeChange = () => {
    setPageSize(pageSize.value)
    loadData()
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

  /* ── Helpers ── */
  const getFieldValue = (rowData, fieldName) => {
    const key = fieldName.replace('field_', '')
    if (!Array.isArray(rowData.summary)) return '-'
    const entry = rowData.summary.find((item) => item.key === key)
    return entry ? String(entry.value) : '-'
  }

  /* ── Chart legend click → filter ── */
  const STATUS_BUCKET_RANGES = {
    '2xx': [200, 300],
    '3xx': [300, 400],
    '4xx': [400, 500],
    '5xx': [500, 600]
  }

  // Maps a Metrics chart key + clicked legend bucket to one or more concrete
  // filters on the underlying Events dataset. Two shapes:
  //   • 'pivot-<field>' → the bucket label itself becomes the filter value
  //     for <field> (used when the chart was built via groupBy pivot).
  //   • { <seriesName>: [{ field, value }, ...] } → fixed (field, value)
  //     pairs appended when the user clicks that series.
  const METRICS_LEGEND_FILTERS = {
    wafThreats: {
      wafRequestsAllowed: [
        { field: 'wafBlock', value: '0' },
        { field: 'wafLearning', value: '0' }
      ],
      wafRequestsThreat: [{ field: 'wafLearning', value: '1' }],
      wafRequestsBlocked: [{ field: 'wafBlock', value: '1' }]
    },
    wafXss: { wafRequestsXssAttacks: [{ field: 'wafAttackFamily', value: '$XSS' }] },
    wafRfi: { wafRequestsRfiAttacks: [{ field: 'wafAttackFamily', value: '$RFI' }] },
    wafSql: { wafRequestsSqlAttacks: [{ field: 'wafAttackFamily', value: '$SQL' }] },
    wafOther: { wafRequestsOthersAttacks: [{ field: 'wafAttackFamily', value: '$OTHERS' }] },
    wafThreatsByHost: 'pivot-host',
    botTraffic: 'pivot-classified',
    botCaptcha: 'pivot-challengeSolved',
    cacheHitMiss: 'pivot-upstreamCacheStatus',
    tieredCacheHitMiss: 'pivot-upstreamCacheStatus'
  }

  const handleLegendFilter = ({ bucket, stackBy, metricsKey }) => {
    if (!bucket) return
    // Events histogram: legacy status / requestMethod stacking.
    if (stackBy === 'status') {
      const range = STATUS_BUCKET_RANGES[bucket]
      if (range) handleAddRangeFilter('status', range[0], range[1])
      else handleAddFilter('status', bucket)
      return
    }
    if (stackBy === 'requestMethod') {
      handleAddFilter('requestMethod', bucket)
      return
    }
    // Metrics chart: look up the series → filter mapping.
    if (!metricsKey) return
    const mapping = METRICS_LEGEND_FILTERS[metricsKey]
    if (!mapping) return
    if (typeof mapping === 'string' && mapping.startsWith('pivot-')) {
      handleAddFilter(mapping.slice('pivot-'.length), bucket)
      return
    }
    const pairs = mapping[bucket]
    if (!Array.isArray(pairs)) return
    pairs.forEach(({ field, value }) => handleAddFilter(field, value))
  }

  /* ── Dataset ── */
  const handleDatasetChange = (dataset) => emit('dataset-change', dataset)
  const datasetDropdownOptions = computed(() =>
    allDatasets.map((ds) => ({ label: ds.title, value: ds.panel }))
  )
  const onDatasetDropdownChange = (event) => {
    const selectedDataset = allDatasets.find((dataset) => dataset.panel === event.value)
    if (selectedDataset) emit('dataset-change', selectedDataset)
  }

  /* ── Export (composable) ── */
  const { dataTableRef, exportMenuRef, toggleExportMenu, exportMenuItems, exportFunctionMapper } =
    useExportData({
      tableData,
      tabSelected: computed(() => props.tabSelected)
    })

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && isFullscreen.value) {
      event.preventDefault()
      isFullscreen.value = false
      return
    }
    handleKeyDown(event)
  }

  /* ── Apply initial share state (once) ── */
  const applyInitialShareState = () => {
    if (props.initialFilterState && typeof props.initialFilterState === 'object') {
      try {
        filterData.value = JSON.parse(JSON.stringify(props.initialFilterState))
      } catch {
        /* ignore */
      }
    }
    if (Array.isArray(props.initialSelectedFields)) {
      selectedFields.value = [...props.initialSelectedFields]
    }
    if (props.initialPageSize) {
      const parsed = Number(props.initialPageSize)
      if (Number.isFinite(parsed) && parsed > 0) {
        pageSize.value = parsed
        setPageSize(parsed)
      }
    }
  }

  /* ── Expose a snapshot of current state for sharing ── */
  const getCurrentShareState = () => ({
    filters: filterData.value ? JSON.parse(JSON.stringify(filterData.value)) : null,
    dataset: props.tabSelected?.panel || null,
    pageSize: pageSize.value,
    selectedFields: [...selectedFields.value],
    documentQuery: documentSearchQuery.value || ''
  })

  /* ── Lifecycle ── */
  onBeforeMount(() => {
    applyInitialShareState()
    refreshFilterData()
  })
  onMounted(async () => {
    document.addEventListener('keydown', onKeyDown)
    await nextTick()
    // Let AdvancedFilterSystem compute timezone-converted timestamps (same as Refresh)
    filterSystemRef.value?.applyFilters()
    loadData()
  })
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeyDown)
    resetSeriesOrderCache()
  })
  // Re-fetch data when KeepAlive reactivates this component (e.g. switching
  // back from Security/Performance tabs). Ensures chart + fields are fresh.
  onActivated(async () => {
    // Wait for the DOM to settle (tab transition) before loading data so the
    // chart container has its final dimensions when C3 initialises.
    await nextTick()
    // Re-apply filters to refresh relative time ranges (e.g. "Last 5 minutes"
    // should be relative to now, not to when the tab was first mounted).
    filterSystemRef.value?.applyFilters()
    // Wait for the reactive filterData update triggered by applyFilters to
    // propagate before calling loadData, otherwise load() may see a stale
    // tsRange and bail out or fetch the wrong window.
    await nextTick()
    loadData()
  })
  watch(isLoading, (loading, was) => {
    if (was && !loading) {
      resetSelection()
      // Persist query to history only after a successful load
      if (tableData.value.length > 0) {
        filterSystemRef.value?.commitQueryToHistory?.()
      }
    }
  })

  defineExpose({ reloadListTable, getCurrentShareState, applyInitialShareState })
</script>

<template>
  <div
    v-if="isTabSelected"
    class="tab-panel-container"
    :class="{ 'tab-panel-container--fullscreen': isFullscreen }"
  >
    <!-- Filter bar -->
    <div class="filter-bar">
      <div class="filter-bar__row">
        <div
          v-if="!hideDatasetSelector"
          class="filter-bar__dataset"
        >
          <span class="text-xs font-medium text-color-secondary">Dataset</span>
          <Dropdown
            appendTo="body"
            :modelValue="props.tabSelected?.panel"
            :options="datasetDropdownOptions"
            optionLabel="label"
            optionValue="value"
            class="filter-bar__dataset-dropdown"
            @change="onDatasetDropdownChange"
            data-testid="dataset-selector-top"
          />
        </div>
        <div class="filter-bar__filters">
          <div class="filter-bar__filters-inner">
            <PrimeButton
              icon="ai ai-filter-alt"
              outlined
              size="small"
              class="flex-shrink-0"
              @click="(e) => savedSearchOverlayRef.toggle(e)"
              v-tooltip.bottom="{ value: 'Saved queries', showDelay: 300 }"
            />
            <div class="filter-bar__aql">
              <AdvancedFilterSystem
                ref="filterSystemRef"
                v-model:filterData="filterData"
                :fieldsInFilter="props.filterFields"
                :dataset="props.tabSelected?.dataset || ''"
                :filterDateRangeMaxDays="365"
                :hideFilterTags="true"
                @updatedFilter="reloadListTableWithHash"
              />
            </div>
          </div>
        </div>
      </div>
      <FilterTagsDisplay
        v-if="filterData?.fields?.length"
        :filters="filterData.fields"
        :fieldsInFilter="props.filterFields"
        @removeFilter="handleRemoveFilter"
      />
    </div>

    <!-- Query History Overlay -->
    <OverlayPanel
      ref="queryHistoryOverlayRef"
      :showCloseIcon="false"
      class="query-history-overlay"
      :pt="{ content: { class: 'p-0' } }"
    >
      <div class="qh-header">
        <span class="text-xs font-semibold text-color-secondary">Recent queries</span>
        <PrimeButton
          v-if="queryHistory.length"
          icon="pi pi-trash"
          text
          rounded
          severity="danger"
          size="small"
          class="!w-6 !h-6"
          @click="handleClearQueryHistory"
        />
      </div>
      <ul
        v-if="queryHistory.length"
        class="qh-list"
      >
        <li
          v-for="(entry, idx) in queryHistory"
          :key="idx"
          class="qh-item"
          @click="() => handleLoadQueryHistoryAndClose(entry)"
        >
          <template
            v-for="(part, fIdx) in getHistoryParts(entry)"
            :key="fIdx"
          >
            <span
              v-if="fIdx > 0"
              class="qh-join"
              >AND</span
            >
            <span class="qh-field">{{ part.field }}</span>
            <span
              v-if="part.operator"
              class="qh-badge"
              >{{ part.operator }}</span
            >
            <span class="qh-value">{{ part.value }}</span>
          </template>
          <span
            v-if="entry.dataset"
            class="qh-badge"
            >{{ entry.dataset }}</span
          >
          <PrimeButton
            icon="pi pi-times"
            text
            rounded
            size="small"
            class="!w-5 !h-5 !p-0 flex-shrink-0"
            @click.stop="removeQueryFromHistory(idx)"
          />
        </li>
      </ul>
      <div
        v-else
        class="p-4 text-center text-xs text-color-secondary"
      >
        No query history yet.
      </div>
    </OverlayPanel>

    <!-- Saved Searches Overlay -->
    <OverlayPanel
      ref="savedSearchOverlayRef"
      :showCloseIcon="false"
      class="ss-overlay"
      :pt="{ content: { class: 'p-0' } }"
    >
      <div class="ss-header">
        <span class="text-xs font-semibold text-color-secondary">Saved searches</span>
      </div>
      <div class="ss-save-row">
        <InputText
          v-model="saveSearchName"
          placeholder="Name this search..."
          class="w-full text-sm"
          size="small"
          @keydown.enter="handleSaveSearch"
        />
        <PrimeButton
          icon="pi pi-save"
          text
          size="small"
          class="!w-7 !h-7 flex-shrink-0"
          :disabled="!saveSearchName.trim()"
          @click="handleSaveSearch"
        />
      </div>
      <ul
        v-if="savedSearches.length"
        class="ss-list"
      >
        <li
          v-for="entry in savedSearches"
          :key="entry.id"
          class="ss-item"
          @click="() => handleLoadSearchAndClose(entry)"
        >
          <i class="pi pi-bookmark-fill text-xs text-color-secondary" />
          <span class="ss-name">{{ entry.name }}</span>
          <span
            v-if="entry.dataset"
            class="qh-badge"
            >{{ entry.dataset }}</span
          >
          <PrimeButton
            icon="pi pi-times"
            text
            rounded
            size="small"
            class="!w-5 !h-5 !p-0 flex-shrink-0"
            @click.stop="deleteSearch(entry.id)"
          />
        </li>
      </ul>
      <div
        v-else
        class="p-4 text-center text-xs text-color-secondary"
      >
        No saved searches yet.
      </div>
    </OverlayPanel>

    <!-- Main layout -->
    <div class="discover-layout">
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
          <div class="discover-panel-b">
            <div class="discover-charts-area">
              <!-- Single EventChart — switches between Events and Metrics
                   data sources based on the unified View selector. -->
              <div
                v-if="hasChartConfig || hasMetricsDashboards"
                class="events-chart-group"
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
                  @update:view="selectedView = $event"
                  @brush-select="handleBrushSelect"
                  @legend-filter="handleLegendFilter"
                  @total-computed="setRecordsFound"
                />
                <EventsSummaryBar
                  v-if="showChartSummary && !isMetricsView"
                  :kpis="summaryKpis"
                />
              </div>
            </div>
            <div class="discover-table-row">
              <div class="discover-main-content">
                <div
                  class="flex gap-2 justify-between items-center mb-2 px-2 pt-1 discover-toolbar flex-wrap"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <PrimeButton
                      :icon="sidebarVisible ? 'pi pi-angle-double-left' : 'pi pi-list'"
                      :label="sidebarVisible ? '' : 'Fields'"
                      text
                      size="small"
                      @click="sidebarVisible = !sidebarVisible"
                      v-tooltip.top="{
                        value: sidebarVisible ? 'Hide fields' : 'Show fields',
                        showDelay: 200
                      }"
                    />
                    <span
                      v-if="recordsFound"
                      class="ml-2 px-2 py-0.5 rounded-md text-color discover-docs-badge"
                    >{{ recordsFound }} Documents found</span>
                  </div>
                  <div class="flex gap-2 items-center flex-wrap">
                    <div class="relative hidden md:flex items-center">
                      <i class="pi pi-search absolute left-2 text-xs text-color-secondary" />
                      <InputText
                        v-model="documentSearchQuery"
                        placeholder="Search documents..."
                        size="small"
                        class="pl-7 w-48 text-xs !shadow-none !outline-none"
                      />
                      <PrimeButton
                        v-if="documentSearchQuery"
                        icon="pi pi-times"
                        text
                        rounded
                        size="small"
                        class="!w-5 !h-5 !p-0 absolute right-1"
                        @click="documentSearchQuery = ''"
                      />
                    </div>
                    <PrimeButton
                      icon="pi pi-chevron-down"
                      size="small"
                      severity="secondary"
                      :outlined="detailViewMode !== 'inline'"
                      @click="detailViewMode !== 'inline' && toggleDetailViewMode()"
                      v-tooltip.top="{ value: 'Expand inline', showDelay: 200 }"
                    />
                    <PrimeButton
                      icon="pi pi-window-maximize"
                      size="small"
                      severity="secondary"
                      :outlined="detailViewMode !== 'sidebar'"
                      class="hidden md:inline-flex"
                      @click="detailViewMode !== 'sidebar' && toggleDetailViewMode()"
                      v-tooltip.top="{ value: 'Show in sidebar', showDelay: 200 }"
                    />
                    <PrimeButton
                      outlined
                      size="small"
                      :icon="isFullscreen ? 'pi pi-arrows-alt' : 'pi pi-expand'"
                      class="min-w-max"
                      @click="isFullscreen = !isFullscreen"
                      v-tooltip.left="{
                        value: isFullscreen ? 'Exit fullscreen' : 'Fullscreen',
                        showDelay: 200
                      }"
                    />
                    <Dropdown
                      v-model="pageSize"
                      :options="PAGE_SIZE_OPTIONS"
                      optionLabel="label"
                      optionValue="value"
                      @update:modelValue="handlePageSizeChange"
                      class="toolbar-page-size toolbar-page-size--responsive"
                    />
                    <PrimeButton
                      outlined
                      size="small"
                      icon="ai ai-graphql"
                      class="min-w-max hidden md:inline-flex"
                      @click="eventsPlaygroundOpener"
                      v-tooltip.left="{ value: 'GraphQL Playground', showDelay: 200 }"
                    />
                    <PrimeButton
                      outlined
                      size="small"
                      icon="pi pi-download"
                      class="min-w-max"
                      @click="toggleExportMenu"
                      v-tooltip.left="{ value: 'Export data', showDelay: 200 }"
                      aria-haspopup="true"
                    />
                    <Menu
                      ref="exportMenuRef"
                      :model="exportMenuItems"
                      :popup="true"
                    />
                  </div>
                </div>
                <div
                  ref="tableContainerRef"
                  class="discover-table-container"
                  tabindex="0"
                >
                  <div class="discover-table-scroll-area">
                    <div
                      v-if="isLoading"
                      class="flex flex-col gap-2 p-4 w-full"
                    >
                      <Skeleton
                        v-for="idx in 8"
                        :key="idx"
                        class="w-full h-10"
                      />
                    </div>
                    <DataTable
                      v-else
                      ref="dataTableRef"
                      :value="filteredTableData"
                      dataKey="id"
                      v-model:expandedRows="expandedRows"
                      removableSort
                      scrollable
                      scrollHeight="flex"
                      resizableColumns
                      columnResizeMode="expand"
                      :exportFilename="`${props.tabSelected.tabRouter}-logs`"
                      :exportFunction="exportFunctionMapper"
                      :rowClass="getRowClass"
                      :pt="{ bodyRow: { 'data-testid': 'table-body-row' } }"
                      class="discover-data-table"
                      @row-click="onRowClick"
                    >
                      <Column :style="{ width: '2.5rem', minWidth: '2.5rem', maxWidth: '2.5rem' }">
                        <template #body="{ data: rowData }"
                          ><i
                            :class="[
                              'pi pi-chevron-right expand-indicator',
                              { 'expand-indicator--active': isRowActive(rowData) }
                            ]"
                            @click.stop="selectRow(rowData)"
                        /></template>
                      </Column>
                      <Column
                        field="tsFormat"
                        header="Time"
                        sortable
                        sortField="ts"
                        :style="{ width: '140px', minWidth: '130px', maxWidth: '160px' }"
                      >
                        <template #body="{ data: rowData }"
                          ><span
                            class="timestamp-cell"
                            @click="selectRow(rowData)"
                            >{{ rowData.tsFormat }}</span
                          ></template
                        >
                      </Column>
                      <Column
                        v-for="fieldName in selectedFields"
                        :key="'field-' + fieldName"
                        :field="'field_' + fieldName"
                        :header="fieldName"
                        :style="{ minWidth: '120px', maxWidth: '300px' }"
                      >
                        <template #body="{ data: rowData }">
                          <span class="dynamic-field-cell group/dyn">
                            <span
                              class="dynamic-field-value"
                              v-tooltip.top="{
                                value: getFieldValue(rowData, 'field_' + fieldName),
                                showDelay: 500
                              }"
                              v-html="highlightText(getFieldValue(rowData, 'field_' + fieldName))"
                            />
                            <span class="dynamic-field-actions">
                              <PrimeButton
                                icon="pi pi-filter"
                                text
                                size="small"
                                class="!w-5 !h-5 !p-0"
                                @click.stop="
                                  handleAddFilter(
                                    fieldName,
                                    getFieldValue(rowData, 'field_' + fieldName)
                                  )
                                "
                              />
                              <PrimeButton
                                icon="pi pi-filter-slash"
                                text
                                size="small"
                                class="!w-5 !h-5 !p-0"
                                @click.stop="
                                  handleExcludeFilter(
                                    fieldName,
                                    getFieldValue(rowData, 'field_' + fieldName)
                                  )
                                "
                              />
                            </span>
                          </span>
                        </template>
                      </Column>
                      <Column
                        v-if="selectedFields.length === 0"
                        field="summary"
                        header="Document"
                        :style="{ minWidth: '400px' }"
                      >
                        <template #body="{ data: rowData }">
                          <LogFieldBadges
                            :summary="rowData.summary"
                            :highlightFields="selectedFields"
                            :searchQuery="debouncedSearchQuery"
                            :dataset="props.tabSelected.dataset"
                            @toggle-expand="selectRow(rowData)"
                            @add-filter="handleAddFilter"
                            @exclude-filter="handleExcludeFilter"
                          />
                        </template>
                      </Column>
                      <template
                        v-if="detailViewMode === 'inline'"
                        #expansion="{ data: rowData }"
                      >
                        <div class="expansion-content">
                          <EventDocumentView
                            :data="rowData"
                            :onAddFilter="handleAddFilter"
                            :onExcludeFilter="handleExcludeFilter"
                            :isLoading="isDetailLoading"
                            :compact="true"
                          />
                        </div>
                      </template>
                      <template #empty
                        ><EmptyResultsBlock
                          title="No logs found"
                          description="Try adjusting your time range or filters."
                          :noBorder="true"
                          ><template #illustration
                            ><i class="pi pi-search text-5xl text-color-secondary" /></template
                          ><template #default><span /></template></EmptyResultsBlock
                      ></template>
                    </DataTable>
                  </div>
                  <div
                    v-if="isLoadingMore"
                    class="load-more-container"
                  >
                    <i class="pi pi-spin pi-spinner text-color-secondary" /><span
                      class="load-more-info"
                      >Loading more records…</span
                    >
                  </div>
                  <div
                    v-else-if="tableData.length > 0 && hasMoreData"
                    class="load-more-container"
                  >
                    <PrimeButton
                      :label="'Load more ' + pageSize"
                      icon="pi pi-arrow-down"
                      text
                      size="small"
                      @click="loadMoreData"
                    /><span class="load-more-info"
                      >{{ tableData.length }} of {{ recordsFound }} documents</span
                    >
                  </div>
                  <div
                    v-else-if="!hasMoreData && tableData.length > 0"
                    class="load-more-container"
                  >
                    <span class="load-more-info">All documents loaded</span>
                  </div>
                </div>
              </div>
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
      </ResizableSplitter>
    </div>
  </div>
</template>

<style scoped>
  .tab-panel-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: 0.75rem;
  }

  /* ── Filter bar ── */
  .filter-bar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 1px solid var(--surface-border);
    padding: 0.75rem;
    border-radius: var(--border-radius);
  }

  .filter-bar__row {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .filter-bar__dataset {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .filter-bar__dataset-dropdown {
    width: 13rem;
  }

  .filter-bar__filters {
    flex: 1 1 300px;
    min-width: 0;
  }

  .filter-bar__filters-inner {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .filter-bar__aql {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 768px) {
    .filter-bar__row {
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-bar__dataset {
      width: 100%;
    }

    .filter-bar__dataset-dropdown {
      flex: 1;
      width: auto;
    }

    .filter-bar__filters {
      width: 100%;
      flex-basis: 100%;
    }

    .discover-layout {
      min-height: 200px;
    }

    /* Force sidebar hidden on mobile via splitter collapse */
    :deep(.resizable-splitter > .panel-a) {
      display: none !important;
    }
    :deep(.resizable-splitter > .handle) {
      display: none !important;
    }

    .discover-charts-area {
      padding: 0.375rem 0;
    }

    .discover-docs-badge {
      font-size: 0.6875rem;
      padding: 0.125rem 0.375rem;
    }

    .discover-toolbar {
      gap: 0.25rem;
      padding-left: 0.25rem;
      padding-right: 0.25rem;
    }
  }

  @media (max-width: 640px) {
    .discover-docs-badge {
      font-size: 0.625rem;
      max-width: 10rem;
    }
  }
  .tab-panel-container--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: var(--surface-ground);
    padding: 0.5rem;
    overflow: auto;
  }
  .tab-panel-container--fullscreen .discover-charts-area {
    display: none !important;
  }
  .tab-panel-container--fullscreen .discover-layout {
    flex: 1;
    border: none;
    border-radius: 0;
  }

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
  :deep(.discover-layout .panel-a) {
    background: var(--surface-ground);
  }
  .discover-main-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .discover-panel-b {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
  .discover-charts-area {
    flex-shrink: 0;
    width: 100%;
    padding: 0.75rem 0;
  }
  .events-chart-group {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    overflow: visible;
  }
  .events-chart-group :deep(.event-chart-wrapper) {
    border: none;
    border-radius: 0;
    margin-bottom: 0;
  }
  .discover-table-row {
    display: flex;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
  .discover-table-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    outline: none;
  }
  .discover-table-scroll-area {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  :deep(.splitter--sidebar-collapsed .panel-a),
  :deep(.splitter--sidebar-collapsed .handle) {
    display: none !important;
  }

  /* Query History & Saved Searches */
  .query-history-overlay {
    width: 400px;
    max-width: calc(100vw - 2rem);
  }
  .qh-header,
  .ss-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
  }
  .qh-list,
  .ss-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    max-height: 260px;
  }
  .qh-item,
  .ss-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.15s;
    border-bottom: 1px solid var(--surface-border);
  }
  .qh-item:last-child,
  .ss-item:last-child {
    border-bottom: none;
  }
  .qh-item:hover,
  .ss-item:hover {
    background: var(--surface-hover);
  }
  .qh-badge {
    font-size: 0.65rem;
    color: var(--text-color-secondary);
    background: var(--surface-ground);
    padding: 2px 6px;
    border-radius: var(--border-radius);
    flex-shrink: 0;
    white-space: nowrap;
  }
  .qh-field {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.75rem;
    color: var(--text-color);
    flex-shrink: 0;
    white-space: nowrap;
  }
  .qh-value {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.75rem;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .qh-join {
    font-size: 0.65rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
  }
  :deep(.ss-overlay) {
    width: 360px;
    max-width: calc(100vw - 2rem);
  }
  .ss-save-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
  }
  .ss-name {
    flex: 1;
    font-size: 0.78rem;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Load More */
  .load-more-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-top: 1px solid var(--surface-border);
    background: var(--surface-card);
    flex-shrink: 0;
  }
  .load-more-info {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }

  /* DataTable */
  :deep(.discover-data-table) {
    width: 100%;
    table-layout: auto;
  }
  :deep(.discover-data-table .p-datatable-wrapper) {
    overflow: auto !important;
  }
  :deep(.discover-data-table .p-datatable-table) {
    table-layout: auto;
    width: 100%;
  }
  :deep(.discover-data-table .p-datatable-thead > tr > th) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--text-color-secondary);
    background: var(--surface-ground);
    border-bottom: 2px solid var(--surface-border);
    position: sticky;
    top: 0;
    z-index: 1;
    white-space: nowrap;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr > td) {
    padding: 0.65rem 0.75rem;
    vertical-align: top;
    border-bottom: 1px solid var(--surface-border);
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    transition:
      background-color 0.15s,
      box-shadow 0.15s;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr:nth-child(even) > td) {
    background: var(--table-body-row-even-bg);
  }
  :deep(.discover-data-table .p-datatable-tbody > tr:nth-child(odd) > td) {
    background: var(--surface-card);
  }
  :deep(.discover-data-table .p-datatable-tbody > tr:hover > td) {
    background: var(--table-body-row-hover-bg) !important;
    cursor: pointer;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--active > td) {
    background: color-mix(in srgb, var(--primary-color) 6%, transparent) !important;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--active > td:first-child) {
    box-shadow: inset 3px 0 0 0 var(--primary-color);
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--active:hover > td) {
    background: color-mix(in srgb, var(--primary-color) 10%, transparent) !important;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--expanded > td) {
    background: var(--surface-100) !important;
    border-bottom-color: transparent;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.row--focused > td) {
    background: var(--surface-hover) !important;
  }
  :deep(.discover-data-table .p-datatable-tbody > tr.p-datatable-row-expansion > td) {
    padding: 0;
    background: var(--surface-ground);
  }
  :deep(.discover-data-table .p-datatable-header) {
    display: none;
  }
  /* Empty state: fill the available scroll area height instead of leaving a gap */
  :deep(.discover-data-table .p-datatable-wrapper) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  :deep(.discover-data-table .p-datatable-emptymessage) {
    flex: 1;
  }
  :deep(.discover-data-table .p-datatable-emptymessage > td) {
    height: 100%;
  }

  /* Toolbar: align page-size dropdown height with small buttons */
  :deep(.toolbar-page-size .p-dropdown-label) {
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
    font-size: 0.875rem;
  }
  :deep(.toolbar-page-size) {
    min-height: 2rem;
  }
  .toolbar-page-size--responsive {
    width: 7rem;
  }
  @media (max-width: 768px) {
    .toolbar-page-size--responsive {
      width: 5rem;
    }
  }

  /* Splitter handle: thinner divider, remove redundant sidebar border */
  :deep(.field-sidebar) {
    border-right: none;
  }
  :deep(.resizable-splitter > .handle) {
    width: 0.375rem !important;
  }

  /* Cells */
  .expand-indicator {
    font-size: 0.7rem;
    color: var(--text-color-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition:
      color 0.15s,
      transform 0.2s,
      background-color 0.15s;
  }
  .expand-indicator:hover {
    color: var(--text-color);
    background: var(--surface-hover);
  }
  .expand-indicator--active {
    color: var(--primary-color);
    transform: rotate(90deg);
  }
  .timestamp-cell {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.72rem;
    color: var(--text-color-secondary);
    white-space: nowrap;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    transition: background-color 0.15s;
  }
  .timestamp-cell:hover {
    background: var(--surface-hover);
    color: var(--text-color);
  }
  .dynamic-field-cell {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    position: relative;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.75rem;
  }
  .dynamic-field-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
  .dynamic-field-value :deep(.search-highlight),
  :deep(.search-highlight) {
    background: var(--yellow-500, #eab308);
    color: var(--surface-ground);
    border-radius: 2px;
    padding: 0 1px;
  }
  .dynamic-field-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.1s;
  }
  .dynamic-field-cell:hover .dynamic-field-actions {
    visibility: visible;
    opacity: 1;
  }
  .expansion-content {
    padding: 1rem 2rem 1rem 3rem;
    border-left: 3px solid var(--series-one-color, #fba86f);
    animation: expandIn 0.25s ease-out;
  }
  @keyframes expandIn {
    from {
      opacity: 0;
      max-height: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      max-height: 600px;
      transform: translateY(0);
    }
  }

  /* Documents found badge */
  .discover-docs-badge {
    font-size: 0.8125rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  /* ── Responsive breakpoints ── */
  @media (max-width: 768px) {
    .discover-charts-area {
      padding: 0.5rem 0;
    }

    .discover-docs-badge {
      font-size: 0.6875rem;
      padding: 0.125rem 0.375rem;
    }

    .discover-toolbar {
      gap: 0.25rem;
    }
  }

  @media (max-width: 640px) {
    .discover-docs-badge {
      font-size: 0.625rem;
      max-width: 10rem;
    }
  }
</style>
