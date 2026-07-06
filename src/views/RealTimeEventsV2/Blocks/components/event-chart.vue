<script setup>
  import {
    onMounted,
    onBeforeUnmount,
    onActivated,
    onDeactivated,
    ref,
    watch,
    nextTick,
    computed
  } from 'vue'
  import c3 from 'c3'
  import Skeleton from '@aziontech/webkit/skeleton'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import { useChartBuilder, buildC3Config } from '../../composables/useChartBuilder'
  import { useBreakpoint } from '../../composables/useBreakpoint'
  import { usePointerType } from '../../composables/usePointerType'
  import { useChartBrush } from '../../composables/useChartBrush'
  import { useKeepAliveResource } from '@/composables/useKeepAliveResource.js'
  import DivergenceIndicator from './divergence-indicator.vue'
  import ViewSelector from './view-selector.vue'

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
    showSummary: { type: Boolean, default: true },
    collapsed: { type: Boolean, default: false },
    // `true` when a Metrics view is active and its query dropped ≥1 filter
    // field the Events list applies — the chart and the list can diverge.
    // Drives the header DivergenceIndicator; parent owns the resolution.
    chartDiverges: { type: Boolean, default: false }
  })

  const emit = defineEmits(['brush-select', 'update:view', 'legend-filter', 'toggle-collapse'])

  // Reactive viewport + pointer detection. The composables manage their own
  // MediaQueryList listener cleanup, so we just consume the refs. Heights + the
  // crosshair are CSS-driven (clamp + @media (pointer: fine)); the refs are
  // exposed via defineExpose so tests can observe the chart's breakpoint state.
  const { isAtMost, is: isBreakpoint, current: currentBreakpoint } = useBreakpoint()
  const { isCoarse } = usePointerType()
  const isMobileViewport = isAtMost('mobile')
  // Bottom-sheet variant of the View dropdown is used at mobile-s + mobile
  // breakpoints (<640px) where a popover anchored to a tiny trigger is too
  // cramped and easy to mis-tap. Tablet+ keeps the popover (existing UX).
  const isBottomSheetMobileS = isBreakpoint('mobile-s')
  const isBottomSheetMobile = isBreakpoint('mobile')
  const isBottomSheetMode = computed(() => isBottomSheetMobileS.value || isBottomSheetMobile.value)
  // Touch policy follows pointer capability, not viewport size: an iPad with a
  // Magic Keyboard exposes both fine and coarse pointers, and we want the
  // tap-to-tooltip path active whenever the primary input is touch.
  const isTouchPrimary = isCoarse

  const isStacked = computed(() => props.stackBy && props.stackBy !== 'none')

  // ViewSelector owns the popover/bottom-sheet menu state + focus-trap; the
  // shell only forwards the two-way binding via `update:view` and gives the
  // selector a ref so it can be closed on keep-alive deactivate.
  const viewSelectorRef = ref(null)
  const hideTooltipForMenu = () => chartInstance.value?.tooltip?.hide?.()

  // Metrics views where legend bucket == filterable value (pivot charts).
  // Synthetic multi-series charts (Threats vs Requests, XSS, RFI, SQL, Other) are
  // NOT listed — each series there is a decomposition of one universe, so a legend
  // click should toggle series visibility (c3 native), not apply a filter.
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

  // ── Pointer/brush/tooltip (extracted composable) ──
  // Geometry is read through getRect/getOffsetWidth so the pixel→time math is
  // testable and decoupled from a specific DOM node. The composable exposes
  // the selection-overlay ref and the latest pointer position for the c3
  // tooltip positioner, and owns its own tap-to-tooltip timer teardown.
  const {
    selectionOverlay,
    pointerPos,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    teardown: teardownBrush
  } = useChartBrush({
    getRect: () => chartRef.value?.getBoundingClientRect() ?? null,
    getOffsetWidth: () => chartRef.value?.offsetWidth ?? 0,
    getRangeBegin: () => props.tsRangeBegin,
    getRangeEnd: () => props.tsRangeEnd,
    getChartInstance: () => chartInstance.value,
    onBrushSelect: (range) => emit('brush-select', range)
  })

  const { chartConfig, chartData, formattedTotal, chartKind, labelWidthCache, resetTickCache } =
    useChartBuilder(props)

  // Chart lifecycle
  let initChartTimer = null
  // Monotonic token to cancel in-flight builds when a newer one is scheduled.
  let buildToken = 0
  // Debounce timer for ResizeObserver to avoid excessive re-renders.
  let resizeTimer = null
  // ResizeObserver loop-error mitigation: coalesce observer fires through
  // rAF so we never resize during the same frame that produced the
  // observation event (browsers log "ResizeObserver loop completed with
  // undelivered notifications" otherwise).
  let rafHandle = null
  let pendingResize = false

  const chartContainerRef = ref(null)

  const initChart = () => {
    clearTimeout(initChartTimer)
    const myToken = ++buildToken
    initChartTimer = setTimeout(() => {
      initChartTimer = null
      if (myToken !== buildToken) return
      // Keep-alive guard (audit L2): a watched prop can mutate while this tab is
      // deactivated (setup-scope watchers stay live under <KeepAlive>). Building
      // here would leak a live c3 instance into a hidden tab; skip — onActivated
      // always rebuilds (chartInstance is null after teardown), so nothing is lost.
      if (!isActive.value) return
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
        // Defensive DOM cleanup: if `destroy()` throws silently or an SVG survives
        // teardown, the next `c3.generate()` injects a second SVG → overlapping
        // labels (stale Y-axis ticks over the new ones). Emptying innerHTML
        // guarantees a clean slate before generate().
        chartRef.value.innerHTML = ''
        // Resolve the outer .chart-container div for tooltip edge-flip
        const chartContainer =
          chartContainerRef.value || chartRef.value.closest('.chart-container') || chartRef.value
        const c3Config = buildC3Config({
          chartRef: chartRef.value,
          chartData: chartData.value,
          chartConfig: chartConfig.value,
          chartKind: chartKind.value,
          onLegendClick: handleLegendClick,
          chartContainer,
          // Pass an accessor so the tooltip.position callback reads the
          // latest pointer position at the moment the tooltip renders.
          getPointerPos: () => pointerPos.value,
          // Viewport-aware tick decimation: reads the current breakpoint
          // token and reuses the composable-scoped label-width cache so
          // measurements aren't repeated across re-renders.
          breakpoint: currentBreakpoint.value,
          labelWidthCache
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

  // Expanding from collapsed: hide the canvas until c3 has resized to avoid
  // a visible flick where the chart briefly renders at the wrong width.
  const isResizing = ref(false)
  const expandAndResize = () => {
    isResizing.value = true
    nextTick(() => {
      if (chartInstance.value && chartRef.value) {
        try {
          chartInstance.value.resize()
        } catch {
          initChart()
        }
      } else {
        initChart()
      }
      // One extra frame so the browser has painted the resized chart
      requestAnimationFrame(() => {
        isResizing.value = false
      })
    })
  }

  // Watchers. The chart's bucket-sum estimate is no longer emitted as a count
  // (numeric loadEventsCount SoT — §2.1(5); the old total-computed bridge is gone).
  // Identity-only watch: useEventsData replaces the array on every reload, so deep
  // traversal here would be pure overhead.
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
  // When expanding from collapsed state the chart container goes from
  // display:none to visible — hide canvas during resize to avoid flick.
  watch(
    () => props.collapsed,
    (isCollapsed) => {
      if (!isCollapsed) expandAndResize()
    }
  )

  // Coalesced ResizeObserver callback. The rAF/pending-flag pair ensures
  // we never invoke c3.resize during the same frame that produced the
  // observation event — the workaround for the well-known "ResizeObserver
  // loop completed with undelivered notifications" browser warning.
  const onObserverFire = () => {
    if (pendingResize) return
    pendingResize = true
    rafHandle = requestAnimationFrame(() => {
      rafHandle = null
      pendingResize = false
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resizeTimer = null
        if (chartInstance.value) resizeChart()
        else initChart()
      }, 80)
    })
  }

  // ── Viewport resources (keep-alive-safe) ──
  // The ResizeObserver is acquired when the component becomes live (mount/activate)
  // and released when it goes away (unmount/deactivate); useKeepAliveResource owns
  // that symmetry (one pair per live period). View-menu listeners live in ViewSelector.
  const acquireViewportResources = () => {
    // Observe the outer chart-container so sidebar open/close and splitter
    // drags are detected — the inner canvas div doesn't change size until
    // after C3 redraws, so observing it misses the triggering resize.
    const observeTarget = chartContainerRef.value || chartRef.value
    let ro = null
    if ('ResizeObserver' in window && observeTarget) {
      ro = new ResizeObserver(onObserverFire)
      ro.observe(observeTarget)
    }
    return ro
  }

  const releaseViewportResources = (ro) => {
    if (ro) ro.disconnect()
  }

  const { isActive } = useKeepAliveResource(acquireViewportResources, releaseViewportResources)

  // Component-owned teardown for concerns NOT managed by useKeepAliveResource:
  // build/resize timers, the coalescing rAF, the pending-resize flag, the
  // in-flight build token, the brush composable's tooltip timer/gesture state,
  // and the c3 instance.
  const teardownChartInternals = () => {
    clearTimeout(initChartTimer)
    clearTimeout(resizeTimer)
    teardownBrush()
    initChartTimer = null
    resizeTimer = null
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
    pendingResize = false
    buildToken += 1 // invalidate any pending nextTick
    if (chartInstance.value) {
      try {
        chartInstance.value.destroy()
      } catch {
        /* noop */
      }
      chartInstance.value = null
    }
    // Drop measured label widths so the next build starts with a clean cache.
    resetTickCache()
  }

  onMounted(() => {
    initChart()
  })

  onBeforeUnmount(teardownChartInternals)

  onDeactivated(() => {
    teardownChartInternals()
    viewSelectorRef.value?.closeViewMenu?.()
  })

  onActivated(() => {
    // KeepAlive reactivation: the container may have a new width after a tab
    // switch or sidebar toggle — always resize before re-rendering data. This
    // refit reads chartRef and is independent of the ResizeObserver, which the
    // composable re-acquires on activate.
    nextTick(() => {
      if (chartInstance.value) resizeChart()
      else initChart()
    })
  })

  defineExpose({
    refresh: initChart,
    resize: resizeChart,
    // Surfaced for tests + introspection — see useBreakpoint/usePointerType.
    currentBreakpoint,
    isMobileViewport,
    isTouchPrimary
  })
</script>

<template>
  <div
    class="event-chart-wrapper"
    data-testid="event-chart"
    aria-describedby="event-chart-instructions"
  >
    <!--
      Visually-hidden instructions for screen-reader users. The chart's brush
      zoom is pointer-only (click-and-drag) and has no keyboard equivalent, so
      we point screen-reader and keyboard users to the date-range picker, which
      offers the same time-range selection through accessible controls.
    -->
    <span
      id="event-chart-instructions"
      class="chart-sr-only"
      >This chart can be zoomed by dragging across a time range with a pointer. To select a time
      range without a pointer, use the date-range picker in the toolbar.</span
    >
    <!-- Header -->
    <div class="chart-header">
      <button
        type="button"
        class="chart-header__collapse-btn"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? 'Expand chart' : 'Collapse chart'"
        @click="emit('toggle-collapse')"
      >
        <i
          class="pi"
          :class="collapsed ? 'pi-chevron-right' : 'pi-chevron-down'"
        />
      </button>
      <!-- When collapsed show a label so the user knows what is hidden -->
      <span
        v-if="collapsed"
        class="chart-header__collapsed-label"
        >CHART</span
      >
      <!-- Count only shown when expanded — DiscoverToolbar shows it when collapsed -->
      <span
        v-if="!collapsed"
        class="chart-header__count"
      >
        <span class="chart-header__total">{{ formattedTotal }}</span>
        <span class="chart-header__label">events</span>
        <DivergenceIndicator :visible="chartDiverges" />
      </span>
      <div
        v-if="!collapsed"
        class="chart-header__controls"
      >
        <ViewSelector
          v-if="showView"
          ref="viewSelectorRef"
          :view="view"
          :view-options="viewOptions"
          :is-bottom-sheet-mode="isBottomSheetMode"
          :hide-tooltip="hideTooltipForMenu"
          @update:view="emit('update:view', $event)"
        />
        <span class="chart-header__hint">Drag to zoom</span>
      </div>
    </div>

    <!-- Chart body — v-show preserves the c3 instance across collapse/expand -->
    <div
      v-show="!collapsed"
      :style="isResizing ? 'visibility: hidden' : ''"
    >
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
        ref="chartContainerRef"
        class="chart-container"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerCancel"
        @pointerleave="handlePointerLeave"
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

  .chart-header__collapse-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    /* 1.5rem = 24px — meets the WCAG 2.5.5 minimum tap target. */
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-color-secondary);
  }
  .chart-header__collapse-btn > i {
    font-size: 0.625rem;
  }

  .chart-header__collapsed-label {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--text-color-secondary);
    text-transform: uppercase;
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

  /*
   * Chart body height is a fluid clamp: a floor keeps it legible on short
   * viewports, a ceiling stops it eating large monitors, dvh scales between.
   * Same formula on loading/empty states prevents layout jump.
   */
  .chart-loading {
    height: clamp(140px, 22dvh, 240px);
    padding: 0.75rem;
  }

  .chart-container {
    position: relative;
    height: clamp(140px, 22dvh, 240px);
    padding: 0.25rem;
    /* Default cursor; crosshair only when a fine pointer is in use. */
    cursor: default;
    /*
     * Allow vertical page scrolling on touch devices but consume
     * horizontal gestures so brush-to-zoom can fire. Without this the
     * browser intercepts touchmove for pan-x and our pointermove never
     * fires after the first 10px.
     */
    touch-action: pan-y;
  }

  /*
   * Crosshair is meaningful only for precision pointers. On touch the
   * cursor never renders so the rule is a no-op there, but coarse +
   * fine devices (iPad with trackpad) get the right affordance.
   */
  @media (pointer: fine) {
    .chart-container {
      cursor: crosshair;
    }
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
    height: clamp(140px, 22dvh, 240px);
    color: var(--text-color-secondary);
  }

  /*
   * Visually-hidden utility (sr-only equivalent) used for screen-reader
   * instructions. Kept inline so the component doesn't depend on global
   * utility classes being present.
   */
  .chart-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ── C3 legend: wrap and contain inside the chart area ── */
  :deep(.c3-legend-item text) {
    font-size: 11px !important;
  }

  :deep(.c3 .c3-legend-background) {
    display: none;
  }

  /* Force C3 legend to wrap and not overflow */
  :deep(svg.c3 g.c3-legend-item) {
    font-size: 11px;
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

  /* Area fill: very subtle, won't obscure other series */
  :deep(.c3-area) {
    opacity: 0.05 !important;
  }

  /* Line stroke — 1.5px, readable without dominating */
  :deep(.c3-line) {
    stroke-width: 1.5px !important;
  }

  /* Bar chart: rounded top corners */
  :deep(.c3-bar) {
    rx: 2;
    ry: 2;
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
  }

  @media (max-width: 480px) {
    .chart-header__controls {
      gap: 0.375rem;
    }
  }

  /*
   * Ultra-narrow viewport fallback (e.g. iPhone SE in landscape split view,
   * watch-style screens). The numeric total alone communicates the count;
   * dropping the "events" word reclaims ~50px for the view dropdown.
   */
  @media (max-width: 320px) {
    .chart-header__label {
      display: none;
    }
  }
</style>
