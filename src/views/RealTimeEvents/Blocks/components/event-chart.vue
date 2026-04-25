<script setup>
  import { onMounted, onBeforeUnmount, onActivated, onDeactivated, ref, watch, nextTick, computed } from 'vue'
  import c3 from 'c3'
  import Skeleton from '@aziontech/webkit/skeleton'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import { useChartBuilder, buildC3Config } from '../../composables/useChartBuilder'

  defineOptions({ name: 'EventChart' })

  const props = defineProps({
    data: { type: Array, default: () => [] },
    configKey: { type: String, required: true },
    tsRangeBegin: { type: [Date, String], default: null },
    tsRangeEnd: { type: [Date, String], default: null },
    isLoading: { type: Boolean, default: false },
    hasError: { type: Boolean, default: false },
    userTimezone: { type: String, default: 'UTC' },
    // Stack selection for the Events histogram family. Ignored by the
    // multi-series Metrics timeseries family (no stacking applies there).
    stackBy: { type: String, default: 'none' },
    // ── Unified View selector ──
    // Grouped option model — [{ group, items: [{ label, value, ... }] }] —
    // passed down from tab-panel-block. Replaces the legacy `stackByOptions`
    // + separate `Metrics` top dropdown with a single control.
    viewOptions: { type: Array, default: () => [] },
    view: { type: String, default: 'events:none' },
    showView: { type: Boolean, default: true },
    showSummary: { type: Boolean, default: true }
  })

  const emit = defineEmits(['brush-select', 'total-computed', 'update:view', 'legend-filter'])

  const isStacked = computed(() => props.stackBy && props.stackBy !== 'none')
  const viewModel = computed({
    get: () => props.view,
    set: (value) => emit('update:view', value)
  })

  // ── View popover state ──
  // The panel is teleported to <body> so stacking contexts of ancestor
  // containers (chart card, ResizableSplitter) can't clip it. Position is
  // computed from the trigger's bounding rect on open and re-applied on
  // scroll/resize while the menu is open.
  const isViewMenuOpen = ref(false)
  const viewTriggerRef = ref(null)
  const viewPanelRef = ref(null)
  const viewPanelStyle = ref({ top: '0px', left: '0px', minWidth: '0px' })

  const selectedViewLabel = computed(() => {
    for (const group of props.viewOptions || []) {
      const match = (group.items || []).find((item) => item.value === props.view)
      if (match) return match.label
    }
    return 'Default'
  })

  const updateViewPanelPosition = () => {
    const trigger = viewTriggerRef.value
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    viewPanelStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.right - Math.max(rect.width, 192)}px`,
      minWidth: `${Math.max(rect.width, 192)}px`
    }
  }

  const toggleViewMenu = () => {
    isViewMenuOpen.value = !isViewMenuOpen.value
    if (isViewMenuOpen.value) {
      nextTick(updateViewPanelPosition)
    }
  }
  const closeViewMenu = () => {
    isViewMenuOpen.value = false
  }
  const selectViewItem = (value) => {
    viewModel.value = value
    closeViewMenu()
  }
  const onViewDocumentClick = (event) => {
    if (!isViewMenuOpen.value) return
    const trigger = viewTriggerRef.value
    const panel = viewPanelRef.value
    if (trigger?.contains(event.target)) return
    if (panel?.contains(event.target)) return
    closeViewMenu()
  }
  const onViewEscape = (event) => {
    if (event.key === 'Escape') closeViewMenu()
  }
  const onViewportChange = () => {
    if (isViewMenuOpen.value) updateViewPanelPosition()
  }

  // Metrics views where legend bucket == filterable value (pivot charts).
  // Synthetic multi-series charts (Threats vs Requests, XSS, RFI, SQL,
  // Other) are NOT listed here — in those charts each series is already a
  // decomposition of the same universe, so clicking a legend entry should
  // toggle series visibility (c3 native behavior) instead of trying to
  // apply a nonsensical filter.
  const PIVOT_METRICS_KEYS = new Set([
    'wafThreatsByHost',
    'botTraffic',
    'botCaptcha',
    'cacheHitMiss',
    'tieredCacheHitMiss'
  ])

  const handleLegendClick = (bucket) => {
    const isMetrics = typeof props.view === 'string' && props.view.startsWith('metrics:')
    // Events histogram: only the status/requestMethod stacks emit filters.
    if (!isMetrics && !isStacked.value) return
    if (isMetrics) {
      const metricsKey = props.view.slice('metrics:'.length)
      // Non-pivot metrics chart: let c3 handle legend clicks natively
      // (hide/show the series). Returning without emitting keeps the
      // default toggle wired up inside useChartBuilder.
      if (!PIVOT_METRICS_KEYS.has(metricsKey)) return
      emit('legend-filter', { bucket, stackBy: props.stackBy, metricsKey })
      return
    }
    emit('legend-filter', { bucket, stackBy: props.stackBy, metricsKey: null })
  }

  const chartRef = ref(null)
  const chartInstance = ref(null)
  const isDragging = ref(false)
  const dragStartX = ref(null)
  const dragEndX = ref(null)
  const selectionOverlay = ref(null)

  const { chartConfig, chartData, totalEvents, formattedTotal, chartKind } = useChartBuilder(props)

  // Chart lifecycle
  let initChartTimer = null
  // Monotonic token to cancel in-flight builds when a newer one is scheduled.
  let buildToken = 0
  // Debounce timer for ResizeObserver to avoid excessive re-renders.
  let resizeTimer = null

  const initChart = () => {
    clearTimeout(initChartTimer)
    const myToken = ++buildToken
    initChartTimer = setTimeout(() => {
      initChartTimer = null
      if (myToken !== buildToken) return
      if (chartInstance.value) {
        try {
          chartInstance.value.destroy()
        } catch {
          /* noop */
        }
        chartInstance.value = null
      }
      nextTick(() => {
        if (myToken !== buildToken) return
        if (!chartRef.value) return
        const c3Config = buildC3Config({
          chartRef: chartRef.value,
          chartData: chartData.value,
          chartConfig: chartConfig.value,
          chartKind: chartKind.value,
          onLegendClick: handleLegendClick
        })
        if (!c3Config) return
        chartInstance.value = c3.generate(c3Config)
      })
    }, 50)
  }

  // Fast resize: just tell C3 to re-fit without full rebuild
  const resizeChart = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      resizeTimer = null
      if (!chartInstance.value || !chartRef.value) return
      try {
        chartInstance.value.resize()
      } catch {
        initChart()
      }
    }, 50)
  }

  // Brush selection
  const handleMouseDown = (event) => {
    if (!chartRef.value) return
    isDragging.value = true
    const rect = chartRef.value.getBoundingClientRect()
    dragStartX.value = event.clientX - rect.left
    dragEndX.value = dragStartX.value
  }

  const handleMouseMove = (event) => {
    if (!isDragging.value || !chartRef.value) return
    const rect = chartRef.value.getBoundingClientRect()
    dragEndX.value = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
    updateSelectionOverlay()
  }

  const handleMouseUp = () => {
    if (!isDragging.value) return
    isDragging.value = false
    if (dragStartX.value !== null && dragEndX.value !== null && chartRef.value) {
      const width = chartRef.value.offsetWidth
      const startPct = Math.min(dragStartX.value, dragEndX.value) / width
      const endPct = Math.max(dragStartX.value, dragEndX.value) / width
      if (Math.abs(endPct - startPct) > 0.05 && props.tsRangeBegin && props.tsRangeEnd) {
        const begin = new Date(props.tsRangeBegin).getTime()
        const end = new Date(props.tsRangeEnd).getTime()
        const range = end - begin
        emit('brush-select', {
          begin: new Date(begin + startPct * range),
          end: new Date(begin + endPct * range)
        })
      }
    }
    dragStartX.value = null
    dragEndX.value = null
    updateSelectionOverlay()
  }

  const updateSelectionOverlay = () => {
    if (!selectionOverlay.value) return
    if (dragStartX.value === null || dragEndX.value === null || !isDragging.value) {
      selectionOverlay.value.style.display = 'none'
      return
    }
    const left = Math.min(dragStartX.value, dragEndX.value)
    const width = Math.abs(dragEndX.value - dragStartX.value)
    selectionOverlay.value.style.display = 'block'
    selectionOverlay.value.style.left = `${left}px`
    selectionOverlay.value.style.width = `${width}px`
  }

  // Watchers
  watch(totalEvents, (val) => emit('total-computed', val))
  // Identity-only watch: useEventsData replaces the array on every reload so
  // deep traversal here would be pure overhead.
  watch(() => props.data, initChart)
  watch(() => [props.tsRangeBegin, props.tsRangeEnd], initChart)
  watch(() => props.userTimezone, initChart)
  watch(() => props.stackBy, initChart)
  watch(
    () => props.isLoading,
    (loading, was) => {
      if (was && !loading) initChart()
    }
  )

  // Resize observer
  let resizeObserver = null

  onMounted(() => {
    initChart()
    if ('ResizeObserver' in window && chartRef.value) {
      resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          if (chartInstance.value) resizeChart()
          else initChart()
        }, 50)
      })
      resizeObserver.observe(chartRef.value)
    }
    document.addEventListener('mousedown', onViewDocumentClick)
    document.addEventListener('keydown', onViewEscape)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
  })

  onBeforeUnmount(() => {
    clearTimeout(initChartTimer)
    clearTimeout(resizeTimer)
    initChartTimer = null
    resizeTimer = null
    buildToken += 1 // invalidate any pending nextTick
    document.removeEventListener('mousedown', onViewDocumentClick)
    document.removeEventListener('keydown', onViewEscape)
    window.removeEventListener('scroll', onViewportChange, true)
    window.removeEventListener('resize', onViewportChange)
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (chartInstance.value) {
      try {
        chartInstance.value.destroy()
      } catch {
        /* noop */
      }
      chartInstance.value = null
    }
  })

  onDeactivated(() => {
    clearTimeout(initChartTimer)
    clearTimeout(resizeTimer)
    initChartTimer = null
    resizeTimer = null
    buildToken += 1
    document.removeEventListener('mousedown', onViewDocumentClick)
    document.removeEventListener('keydown', onViewEscape)
    window.removeEventListener('scroll', onViewportChange, true)
    window.removeEventListener('resize', onViewportChange)
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (chartInstance.value) {
      try {
        chartInstance.value.destroy()
      } catch {
        /* noop */
      }
      chartInstance.value = null
    }
    closeViewMenu()
  })

  onActivated(() => {
    document.addEventListener('mousedown', onViewDocumentClick)
    document.addEventListener('keydown', onViewEscape)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    if ('ResizeObserver' in window && chartRef.value) {
      resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          if (chartInstance.value) resizeChart()
          else initChart()
        }, 50)
      })
      resizeObserver.observe(chartRef.value)
    }
    initChart()
  })

  defineExpose({ refresh: initChart, resize: resizeChart })
</script>

<template>
  <div
    class="event-chart-wrapper"
    data-testid="event-chart"
  >
    <!-- Header -->
    <div class="chart-header">
      <span class="chart-header__count">
        <span class="chart-header__total">{{ formattedTotal }}</span>
        <span class="chart-header__label">events</span>
      </span>
      <div
        v-if="showView"
        class="chart-header__controls"
      >
        <div
          class="chart-header__view-control"
          data-testid="event-chart-view"
        >
          <span class="chart-header__view-label">View</span>
          <div class="chart-header__view-menu">
            <button
              ref="viewTriggerRef"
              type="button"
              class="chart-header__view-trigger"
              :aria-expanded="isViewMenuOpen"
              aria-haspopup="listbox"
              @click="toggleViewMenu"
            >
              <span class="chart-header__view-trigger-label">{{ selectedViewLabel }}</span>
              <i
                class="pi pi-chevron-down chart-header__view-chevron"
                :class="{ 'is-open': isViewMenuOpen }"
              />
            </button>
            <Teleport to="body">
              <div
                v-if="isViewMenuOpen"
                ref="viewPanelRef"
                class="chart-header__view-panel"
                :style="viewPanelStyle"
                role="listbox"
              >
                <template
                  v-for="group in viewOptions"
                  :key="group.group"
                >
                  <div
                    v-if="group.items?.length"
                    class="chart-header__view-group"
                  >
                    <div class="chart-header__view-group-header">{{ group.group }}</div>
                    <button
                      v-for="item in group.items"
                      :key="item.value"
                      type="button"
                      role="option"
                      :aria-selected="item.value === viewModel"
                      class="chart-header__view-item"
                      :class="{ 'is-selected': item.value === viewModel }"
                      @click="selectViewItem(item.value)"
                    >
                      <span class="chart-header__view-item-label">{{ item.label }}</span>
                      <i
                        v-if="item.value === viewModel"
                        class="pi pi-check chart-header__view-item-check"
                      />
                    </button>
                  </div>
                </template>
              </div>
            </Teleport>
          </div>
        </div>
        <span class="chart-header__hint">Drag to zoom</span>
      </div>
    </div>

    <!-- Loading skeleton (GraphsCardBlock pattern) -->
    <div
      v-if="isLoading"
      class="chart-loading"
    >
      <Skeleton class="w-full h-full" />
    </div>

    <!-- Error -->
    <div
      v-else-if="hasError"
      class="chart-empty"
    >
      <InlineMessage severity="error">Failed to load chart data</InlineMessage>
    </div>

    <!-- Chart -->
    <div
      v-else-if="chartData.columns.length"
      class="chart-container"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <div
        ref="chartRef"
        class="chart-canvas"
      />
      <div
        ref="selectionOverlay"
        class="chart-selection"
      />
    </div>

    <!-- Empty -->
    <div
      v-else
      class="chart-empty"
    >
      <i class="pi pi-chart-bar" />
      <span>No events in selected time range</span>
    </div>
  </div>
</template>

<style scoped>
  .event-chart-wrapper {
    background: var(--surface-card);
    overflow: visible;
    margin-bottom: 0;
  }

  .chart-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.375rem;
    padding: 0 0.5rem;
    height: 2.25rem;
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-section);
  }

  .chart-header__count {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    min-width: 0;
  }

  .chart-header__total {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chart-header__label {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
  }

  .chart-header__hint {
    font-size: 0.625rem;
    color: var(--text-color-secondary);
    opacity: 0.7;
    font-style: italic;
  }

  .chart-header__controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-left: auto;
  }

  .chart-header__view-control {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  .chart-header__view-label {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
    letter-spacing: 0.01em;
  }

  .chart-header__view-menu {
    position: relative;
  }

  .chart-header__view-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 7rem;
    max-width: 12rem;
    height: 1.75rem;
    padding: 0 0.5rem;
    font-family: var(--font-family);
    font-size: 0.75rem;
    color: var(--text-color);
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    cursor: pointer;
    transition:
      border-color 120ms ease,
      background 120ms ease;
  }
  .chart-header__view-trigger:hover,
  .chart-header__view-trigger[aria-expanded='true'] {
    border-color: var(--primary-color);
    background: var(--surface-hover, var(--surface-card));
  }

  .chart-header__view-trigger-label {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .chart-header__view-chevron {
    font-size: 0.625rem;
    color: var(--text-color-secondary);
    transition: transform 120ms ease;
  }
  .chart-header__view-chevron.is-open {
    transform: rotate(180deg);
  }

  .chart-header__view-panel {
    position: fixed;
    z-index: 1000;
    min-width: 12rem;
    max-height: 20rem;
    overflow-y: auto;
    padding: 0.25rem 0;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  }

  .chart-header__view-group + .chart-header__view-group {
    border-top: 1px solid var(--surface-border);
    margin-top: 0.25rem;
    padding-top: 0.25rem;
  }

  .chart-header__view-group-header {
    padding: 0.375rem 0.75rem 0.25rem;
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-color-secondary);
    opacity: 0.85;
  }

  .chart-header__view-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-family: var(--font-family);
    font-size: 0.75rem;
    color: var(--text-color);
    background: transparent;
    border: 0;
    cursor: pointer;
    text-align: left;
  }
  .chart-header__view-item:hover {
    background: var(--surface-hover, rgba(0, 0, 0, 0.04));
  }
  .chart-header__view-item.is-selected {
    color: var(--primary-color);
    font-weight: 600;
  }

  .chart-header__view-item-check {
    font-size: 0.6875rem;
    color: var(--primary-color);
  }

  .chart-loading {
    height: 180px;
    padding: 0.75rem;
  }

  .chart-container {
    position: relative;
    height: 180px;
    padding: 0.25rem;
    cursor: crosshair;
  }

  .chart-canvas {
    width: 100%;
    height: 100%;
  }

  .chart-selection {
    position: absolute;
    top: 0;
    height: 100%;
    background: var(--primary-color);
    opacity: 0.15;
    pointer-events: none;
    display: none;
  }

  .chart-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 180px;
    color: var(--text-color-secondary);
  }

  .chart-empty i {
    font-size: 1.25rem;
    opacity: 0.5;
  }

  .chart-empty span {
    font-size: 0.75rem;
  }

  /* Tooltip above all chart content */
  :deep(.c3-tooltip-container) {
    z-index: 99999 !important;
    pointer-events: none;
  }

  /* Focus line visibility on dark background */
  :deep(.c3-xgrid-focus line) {
    stroke: var(--primary-color);
    opacity: 0.6;
  }

  /* Compact tooltip for the small chart area */
  :deep(.c3-tooltip) {
    padding: 10px 12px;
    max-width: 280px;
  }

  :deep(.c3-tooltip th) {
    font-size: 11px;
    height: auto;
    padding-bottom: 8px;
    font-family: var(--font-family);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :deep(.c3-tooltip th:nth-child(1)) {
    height: auto;
  }

  :deep(.c3-tooltip td) {
    font-size: 11px;
    padding: 5px 0 8px 0;
    font-family: var(--font-family);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :deep(.c3-tooltip td.name > span) {
    width: 40px;
    top: -4px;
  }

  :deep(.c3-tooltip td.value) {
    padding-left: 20px;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  }

  /* Soften horizontal grid lines */
  :deep(.c3-grid line) {
    opacity: 0.15;
  }

  /* ── Responsive breakpoints ── */
  @media (max-width: 640px) {
    .chart-header {
      padding: 0.375rem 0.5rem;
    }

    .chart-header__total {
      font-size: 0.75rem;
    }

    .chart-header__hint {
      display: none;
    }

    .chart-header__view-trigger {
      min-width: 6rem;
      font-size: 0.6875rem;
      height: 1.5rem;
    }

    .chart-header__view-label {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .chart-header__controls {
      gap: 0.375rem;
    }

    .chart-header__view-trigger {
      min-width: 5rem;
    }
  }
</style>
