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
    collapsed: { type: Boolean, default: false }
  })

  const emit = defineEmits([
    'brush-select',
    'total-computed',
    'update:view',
    'legend-filter',
    'toggle-collapse'
  ])

  // Reactive viewport + pointer detection. The composables internally manage
  // their own MediaQueryList listener cleanup (setup on mount/activate, teardown
  // on beforeUnmount/deactivate), so we just consume the refs. Heights and the
  // crosshair affordance are driven by CSS (clamp + @media (pointer: fine));
  // the reactive refs are exposed via defineExpose so tests and parent
  // components can assert/observe the same breakpoint state the chart sees.
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
  // ── Bottom-sheet focus management ──
  // The sheet is a modal-style surface; we capture the previously focused
  // element on open and restore it on close so keyboard users return where
  // they were. The Tab handler keeps focus inside the sheet (focus trap).
  const bottomSheetCloseRef = ref(null)
  const previouslyFocusedRef = ref(null)

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

  // Focus-trap keydown handler for the bottom-sheet variant. Named const so
  // add/removeEventListener share the exact same reference — anonymous
  // listeners would silently leak across open/close cycles.
  const onSheetKeydown = (event) => {
    if (event.key !== 'Tab') return
    const root = viewPanelRef.value
    if (!root) return
    const focusables = root.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  // Activates focus-trap + close-button focus for the bottom-sheet. Called
  // only after isViewMenuOpen flips true AND isBottomSheetMode is on.
  const activateBottomSheetTrap = () => {
    previouslyFocusedRef.value =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.addEventListener('keydown', onSheetKeydown)
    nextTick(() => {
      bottomSheetCloseRef.value?.focus?.()
    })
  }

  // Symmetric teardown — must run on every code path that closes the sheet
  // (close button, backdrop, Escape, selection, deactivate, unmount).
  const deactivateBottomSheetTrap = () => {
    document.removeEventListener('keydown', onSheetKeydown)
    const prev = previouslyFocusedRef.value
    previouslyFocusedRef.value = null
    if (prev && typeof prev.focus === 'function') {
      try {
        prev.focus()
      } catch {
        /* element may have been unmounted */
      }
    }
  }

  const toggleViewMenu = () => {
    const willOpen = !isViewMenuOpen.value
    if (willOpen) {
      // Z-index conflict mitigation: the C3 tooltip is teleported with
      // z-index 99999 and the sheet sits at 100000, but on touch devices the
      // residual tooltip from a previous tap reads as visual noise. Hide it
      // before the sheet animates in.
      try {
        chartInstance.value?.tooltip?.hide()
      } catch {
        /* noop — c3 throws when no series is hovered */
      }
    }
    isViewMenuOpen.value = willOpen
    if (willOpen) {
      if (isBottomSheetMode.value) {
        activateBottomSheetTrap()
      } else {
        nextTick(updateViewPanelPosition)
      }
    }
  }
  const closeViewMenu = () => {
    if (!isViewMenuOpen.value) return
    isViewMenuOpen.value = false
    // Always remove the listener; safe to call even if it was never added
    // (e.g., popover branch). This is the leak-defense seam.
    deactivateBottomSheetTrap()
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
  // Track the latest pointer position (viewport coords) so the C3 tooltip
  // position callback can place the tooltip near the cursor on the opposite
  // Y side, never covering the hovered bar/line.
  // eslint-disable-next-line id-length
  const pointerPos = ref({ x: 0, y: 0, present: false })

  const {
    chartConfig,
    chartData,
    totalEvents,
    formattedTotal,
    chartKind,
    labelWidthCache,
    resetTickCache
  } = useChartBuilder(props)

  // Chart lifecycle
  let initChartTimer = null
  // Monotonic token to cancel in-flight builds when a newer one is scheduled.
  let buildToken = 0
  // Debounce timer for ResizeObserver to avoid excessive re-renders.
  let resizeTimer = null
  // Auto-dismiss timer for touch tap-to-show tooltip (3s per spec).
  let tooltipDismissTimer = null
  // ResizeObserver loop-error mitigation: coalesce observer fires through
  // rAF so we never resize during the same frame that produced the
  // observation event (browsers log "ResizeObserver loop completed with
  // undelivered notifications" otherwise).
  let rafHandle = null
  let pendingResize = false
  // Captures the pointer-down origin so we can classify the gesture in
  // pointerup as tap vs drag (< 4px movement = tap).
  let pointerDownAt = null

  const chartContainerRef = ref(null)

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
        // Defensive DOM cleanup: when `chartInstance.destroy()` throws
        // silently (caught above) or when an SVG element survives the
        // teardown for any reason, the next `c3.generate()` would inject
        // a second SVG into the same container — producing overlapping
        // labels (most visibly: stale Y-axis ticks from the previous
        // y-max layered on top of the new ticks). Forcing innerHTML to
        // empty guarantees a clean slate before generate().
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

  // ── Brush selection / tooltip (Pointer Events) ──
  // Tap vs drag threshold in CSS pixels. Anything below is considered a tap
  // (touch shows the tooltip; mouse does nothing extra).
  const TAP_MOVEMENT_THRESHOLD_PX = 4
  // Brush must cover at least 5% of the chart width to fire brush-select.
  const BRUSH_MIN_WIDTH_RATIO = 0.05

  const hideChartTooltip = () => {
    const instance = chartInstance.value
    if (!instance || !instance.tooltip || typeof instance.tooltip.hide !== 'function') return
    try {
      instance.tooltip.hide()
    } catch {
      /* noop — c3 may throw if no series is hovered */
    }
  }

  const clearTooltipDismissTimer = () => {
    if (tooltipDismissTimer !== null) {
      clearTimeout(tooltipDismissTimer)
      tooltipDismissTimer = null
    }
  }

  const showTouchTooltipAt = (clientX) => {
    const instance = chartInstance.value
    if (!instance || !instance.tooltip || typeof instance.tooltip.show !== 'function') return
    if (!chartRef.value) return
    const rect = chartRef.value.getBoundingClientRect()
    const localX = clientX - rect.left
    try {
      // C3's tooltip.show accepts either `{ x: dataX }` or `{ mouse: [x, y] }`.
      // We pass the local pixel coordinate via `mouse` so c3 snaps to the
      // closest data point itself — keeps us agnostic to the x-axis scale.
      instance.tooltip.show({ mouse: [localX, rect.height / 2] })
    } catch {
      // If the c3 build doesn't support tap-to-show (older versions),
      // degrade silently per spec.
    }
  }

  const handlePointerDown = (event) => {
    if (!chartRef.value) return
    // Take ownership of the pointer so subsequent move/up events keep
    // firing on this element even if the finger slides off the canvas.
    try {
      event.target.setPointerCapture?.(event.pointerId)
    } catch {
      /* noop — some browsers reject capture in synthetic events */
    }
    const rect = chartRef.value.getBoundingClientRect()
    const localX = event.clientX - rect.left
    /* eslint-disable id-length */
    pointerDownAt = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
      pointerType: event.pointerType
    }
    /* eslint-enable id-length */
    // A new tap cancels any pending auto-dismiss + currently shown tooltip.
    clearTooltipDismissTimer()
    if (event.pointerType === 'touch') {
      hideChartTooltip()
      // Touch defers brush initialization until we know it's a drag — a
      // tap should NOT leave a residual selection rectangle on the chart.
      return
    }
    isDragging.value = true
    dragStartX.value = localX
    dragEndX.value = localX
  }

  const handlePointerMove = (event) => {
    // Always record the latest pointer position for the tooltip positioner,
    // independent of the brush-selection drag state.
    // eslint-disable-next-line id-length
    pointerPos.value = { x: event.clientX, y: event.clientY, present: true }
    if (!chartRef.value) return
    const rect = chartRef.value.getBoundingClientRect()
    const localX = Math.max(0, Math.min(event.clientX - rect.left, rect.width))

    // Touch: promote a sustained move into a drag once it crosses the tap
    // threshold. Until then we stay neutral so a tap stays a tap.
    if (event.pointerType === 'touch' && !isDragging.value && pointerDownAt) {
      const dx = event.clientX - pointerDownAt.x
      const dy = event.clientY - pointerDownAt.y
      if (Math.hypot(dx, dy) >= TAP_MOVEMENT_THRESHOLD_PX) {
        isDragging.value = true
        dragStartX.value = pointerDownAt.x - rect.left
        dragEndX.value = localX
      }
    }

    if (!isDragging.value) return
    dragEndX.value = localX
    updateSelectionOverlay()
  }

  const finishBrushIfAny = () => {
    if (!isDragging.value) return
    isDragging.value = false
    if (dragStartX.value !== null && dragEndX.value !== null && chartRef.value) {
      const width = chartRef.value.offsetWidth
      const startPct = Math.min(dragStartX.value, dragEndX.value) / width
      const endPct = Math.max(dragStartX.value, dragEndX.value) / width
      if (
        Math.abs(endPct - startPct) > BRUSH_MIN_WIDTH_RATIO &&
        props.tsRangeBegin &&
        props.tsRangeEnd
      ) {
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

  const handlePointerUp = (event) => {
    // Release the implicit capture from pointerdown.
    try {
      event.target.releasePointerCapture?.(event.pointerId)
    } catch {
      /* noop */
    }

    // Tap detection: touch + movement under threshold => show tooltip.
    if (event.pointerType === 'touch' && pointerDownAt) {
      const dx = event.clientX - pointerDownAt.x
      const dy = event.clientY - pointerDownAt.y
      const distance = Math.hypot(dx, dy)
      if (distance < TAP_MOVEMENT_THRESHOLD_PX && !isDragging.value) {
        showTouchTooltipAt(event.clientX)
        clearTooltipDismissTimer()
        tooltipDismissTimer = setTimeout(() => {
          tooltipDismissTimer = null
          hideChartTooltip()
        }, 3000)
        pointerDownAt = null
        return
      }
    }

    finishBrushIfAny()
    pointerDownAt = null
  }

  const handlePointerCancel = (event) => {
    try {
      event.target.releasePointerCapture?.(event.pointerId)
    } catch {
      /* noop */
    }
    clearTooltipDismissTimer()
    hideChartTooltip()
    pointerDownAt = null
    isDragging.value = false
    dragStartX.value = null
    dragEndX.value = null
    updateSelectionOverlay()
  }

  const handlePointerLeave = (event) => {
    // eslint-disable-next-line id-length
    pointerPos.value = { x: 0, y: 0, present: false }
    // Touch pointers don't really "leave" — they're either captured or done.
    // Treat leave as commit for mouse drags only; touch is handled by up/cancel.
    if (event.pointerType === 'touch') return
    finishBrushIfAny()
    pointerDownAt = null
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
  // When expanding from collapsed state the chart container goes from
  // display:none to visible — hide canvas during resize to avoid flick.
  watch(
    () => props.collapsed,
    (isCollapsed) => {
      if (!isCollapsed) expandAndResize()
    }
  )

  // Resize observer
  let resizeObserver = null

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

  onMounted(() => {
    initChart()
    // Observe the outer chart-container so sidebar open/close and splitter
    // drags are detected — the inner canvas div doesn't change size until
    // after C3 redraws, so observing it misses the triggering resize.
    const observeTarget = chartContainerRef.value || chartRef.value
    if ('ResizeObserver' in window && observeTarget) {
      resizeObserver = new ResizeObserver(onObserverFire)
      resizeObserver.observe(observeTarget)
    }
    document.addEventListener('mousedown', onViewDocumentClick)
    document.addEventListener('keydown', onViewEscape)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    // Mobile browsers fire `visualViewport.resize` when the URL bar
    // shows/hides and `orientationchange` on rotate — both invalidate the
    // teleported view-panel anchor position.
    window.addEventListener('orientationchange', onViewportChange)
    window.visualViewport?.addEventListener('resize', onViewportChange)
  })

  onBeforeUnmount(() => {
    clearTimeout(initChartTimer)
    clearTimeout(resizeTimer)
    clearTooltipDismissTimer()
    initChartTimer = null
    resizeTimer = null
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
    pendingResize = false
    pointerDownAt = null
    buildToken += 1 // invalidate any pending nextTick
    document.removeEventListener('mousedown', onViewDocumentClick)
    document.removeEventListener('keydown', onViewEscape)
    // Defense in depth: if the sheet was open when the component unmounts
    // (route change, parent re-render), the trap listener would leak.
    document.removeEventListener('keydown', onSheetKeydown)
    previouslyFocusedRef.value = null
    window.removeEventListener('scroll', onViewportChange, true)
    window.removeEventListener('resize', onViewportChange)
    window.removeEventListener('orientationchange', onViewportChange)
    window.visualViewport?.removeEventListener('resize', onViewportChange)
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
    // Drop measured label widths so a remount starts with a clean cache.
    resetTickCache()
  })

  onDeactivated(() => {
    clearTimeout(initChartTimer)
    clearTimeout(resizeTimer)
    clearTooltipDismissTimer()
    initChartTimer = null
    resizeTimer = null
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle)
      rafHandle = null
    }
    pendingResize = false
    pointerDownAt = null
    buildToken += 1
    document.removeEventListener('mousedown', onViewDocumentClick)
    document.removeEventListener('keydown', onViewEscape)
    // Defense in depth — see onBeforeUnmount for rationale.
    document.removeEventListener('keydown', onSheetKeydown)
    previouslyFocusedRef.value = null
    window.removeEventListener('scroll', onViewportChange, true)
    window.removeEventListener('resize', onViewportChange)
    window.removeEventListener('orientationchange', onViewportChange)
    window.visualViewport?.removeEventListener('resize', onViewportChange)
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
    // Drop measured label widths — the keep-alive cache may rehydrate with
    // stale entries if computed font styles change while inactive.
    resetTickCache()
    closeViewMenu()
  })

  onActivated(() => {
    document.addEventListener('mousedown', onViewDocumentClick)
    document.addEventListener('keydown', onViewEscape)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('orientationchange', onViewportChange)
    window.visualViewport?.addEventListener('resize', onViewportChange)
    const observeTarget = chartContainerRef.value || chartRef.value
    if ('ResizeObserver' in window && observeTarget) {
      resizeObserver = new ResizeObserver(onObserverFire)
      resizeObserver.observe(observeTarget)
    }
    // KeepAlive reactivation: the container may have a new width after a tab
    // switch or sidebar toggle — always resize before re-rendering data.
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
      Visually-hidden instructions for screen-reader users describing the
      chart's primary interaction. Inline styles ensure visibility removal
      regardless of any global utility classes being available.
    -->
    <span
      id="event-chart-instructions"
      class="chart-sr-only"
      >Use the brush selection to zoom into a time range</span
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
      </span>
      <div
        v-if="!collapsed"
        class="chart-header__controls"
      >
        <div
          v-if="showView"
          class="chart-header__view-control"
          data-testid="event-chart-view"
        >
          <span class="chart-header__view-label">View</span>
          <div class="chart-header__view-menu">
            <button
              ref="viewTriggerRef"
              type="button"
              class="chart-header__view-trigger"
              aria-label="Change chart view"
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
              <template v-if="isViewMenuOpen">
                <!-- BOTTOM-SHEET (mobile-s + mobile) -->
                <template v-if="isBottomSheetMode">
                  <div
                    class="view-bottom-sheet-backdrop"
                    data-testid="rte-chart-bottom-sheet-backdrop"
                    @click="closeViewMenu"
                  />
                  <div
                    ref="viewPanelRef"
                    class="view-bottom-sheet"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rte-view-sheet-title"
                    data-testid="rte-chart-bottom-sheet"
                  >
                    <div
                      class="view-bottom-sheet__handle"
                      aria-hidden="true"
                    />
                    <div class="view-bottom-sheet__header">
                      <span
                        id="rte-view-sheet-title"
                        class="view-bottom-sheet__title"
                        >View</span
                      >
                      <button
                        ref="bottomSheetCloseRef"
                        type="button"
                        class="view-bottom-sheet__close"
                        aria-label="Close view menu"
                        data-testid="rte-chart-bottom-sheet-close"
                        @click="closeViewMenu"
                      >
                        <i
                          class="pi pi-times"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    <div
                      role="listbox"
                      class="view-bottom-sheet__list"
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
                  </div>
                </template>

                <!-- POPOVER (tablet+) — existing behavior preserved -->
                <template v-else>
                  <div
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
                </template>
              </template>
            </Teleport>
          </div>
        </div>
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

  /*
   * Chart body height is fluid: 140px floor keeps the chart legible on
   * very short viewports (e.g. 459px tall) without dominating the screen,
   * 320px ceiling avoids it eating the screen on 4K/large monitors, and
   * 32dvh scales with dynamic viewport between those bounds. Same formula
   * on loading/empty states prevents layout jump between them.
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

  /* ──────────────────────────────────────────────────────────────────
   * Bottom-sheet variant of the View dropdown
   * Used on mobile-s + mobile (<640px). Tablet+ keeps the anchored
   * popover (.chart-header__view-panel). Backdrop sits below the sheet
   * but above the C3 tooltip (z=99999) to ensure visual layering even
   * if a tooltip is residual on open.
   * ────────────────────────────────────────────────────────────────── */
  .view-bottom-sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 99998;
    animation: rte-fade-in 280ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  .view-bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100000;
    background: var(--surface-card);
    border-top: 1px solid var(--surface-border);
    border-radius: 12px 12px 0 0;
    max-height: 60dvh;
    overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom);
    animation: rte-slide-up 280ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  .view-bottom-sheet__handle {
    width: 2.5rem;
    height: 0.25rem;
    background: var(--surface-border);
    border-radius: 999px;
    margin: 0.5rem auto;
  }

  .view-bottom-sheet__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.25rem 1rem 0.5rem;
  }

  .view-bottom-sheet__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .view-bottom-sheet__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-color-secondary);
    border-radius: 6px;
  }

  .view-bottom-sheet__close:hover {
    background: var(--surface-hover, rgba(0, 0, 0, 0.04));
  }

  .view-bottom-sheet__list {
    padding-bottom: 0.5rem;
  }

  .view-bottom-sheet__list .chart-header__view-item {
    min-height: 2.75rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }

  @keyframes rte-slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes rte-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .view-bottom-sheet,
    .view-bottom-sheet-backdrop {
      animation-duration: 120ms !important;
    }
    .view-bottom-sheet {
      animation-name: rte-fade-in;
    }
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

    /*
     * Mobile view-trigger: tight bounds (5rem floor / 7rem ceiling) so the
     * dropdown label can ellipsize without pushing the count out of the
     * header. Height stays at 1.5rem for compact density.
     */
    .chart-header__view-trigger {
      min-width: 5rem;
      max-width: 7rem;
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
