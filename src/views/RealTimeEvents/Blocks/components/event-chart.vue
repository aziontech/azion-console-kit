<script setup>
  import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
  import c3 from 'c3'
  import Skeleton from 'primevue/skeleton'
  import InlineMessage from 'primevue/inlinemessage'
  import { getChartConfig } from '../constants/chart-configs'

  defineOptions({ name: 'EventChart' })

  const props = defineProps({
    data: {
      type: Array,
      default: () => []
    },
    configKey: {
      type: String,
      required: true
    },
    tsRangeBegin: {
      type: [Date, String],
      default: null
    },
    tsRangeEnd: {
      type: [Date, String],
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    hasError: {
      type: Boolean,
      default: false
    },
    userTimezone: {
      type: String,
      default: 'UTC'
    }
  })

  const emit = defineEmits(['brush-select', 'total-computed'])

  const chartRef = ref(null)
  const chartInstance = ref(null)
  const isDragging = ref(false)
  const dragStartX = ref(null)
  const dragEndX = ref(null)
  const selectionOverlay = ref(null)

  // Time constants
  const MINUTE = 60 * 1000
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR

  // Use CSS variables from c3.scss for series colors
  const SERIES_COLORS = {
    '2xx': 'var(--series-two-color)',
    '3xx': 'var(--series-three-color)',
    '4xx': 'var(--scale-orange)',
    '5xx': 'var(--series-five-color)'
  }

  // Use Azion brand orange (#F3652B) from azion-theme for chart bars
  const DEFAULT_COLORS = [
    '#F3652B',
    'var(--green-500)',
    'var(--text-color-link)',
    'var(--p-tag-warning-color)',
    'var(--red-500)'
  ]

  const chartConfig = computed(() => getChartConfig(props.configKey))

  // Transform data for C3.js with client-side bucketing.
  // The API returns up to 10000 rows grouped by distinct timestamp (per second).
  // We aggregate these into visual buckets (e.g., 1h for "Today") for clean bars.
  const chartData = computed(() => {
    if (!props.data?.length || !chartConfig.value) {
      return { columns: [], groups: [], seriesNames: [], maxValue: 0 }
    }

    const rawData = props.data

    // Calculate bucket interval based on the time range
    const duration =
      props.tsRangeBegin && props.tsRangeEnd
        ? new Date(props.tsRangeEnd) - new Date(props.tsRangeBegin)
        : 0

    const SEC = 1000
    const MIN = 60 * SEC
    const TARGET = 30

    const INTERVALS = [
      1 * SEC, 5 * SEC, 10 * SEC, 30 * SEC,
      1 * MIN, 5 * MIN, 10 * MIN, 30 * MIN,
      1 * HOUR, 3 * HOUR, 12 * HOUR, 1 * DAY, 7 * DAY, 30 * DAY
    ]
    const rawInterval = duration > 0 ? duration / TARGET : MIN
    const bucketMs = INTERVALS.find((ci) => ci >= rawInterval) || 30 * DAY

    // Generate all bucket slots covering the full range
    const rangeStart = props.tsRangeBegin ? new Date(props.tsRangeBegin).getTime() : 0
    const rangeEnd = props.tsRangeEnd ? new Date(props.tsRangeEnd).getTime() : 0
    const alignedStart = rangeStart > 0 ? Math.floor(rangeStart / bucketMs) * bucketMs : 0

    const bucketMap = new Map()

    // Pre-fill all slots with zero
    if (alignedStart > 0 && rangeEnd > 0) {
      for (let ts = alignedStart; ts <= rangeEnd; ts += bucketMs) {
        bucketMap.set(ts, 0)
      }
    }

    // Aggregate raw data into buckets
    rawData.forEach((item) => {
      if (!item.ts) return
      const tsMs = new Date(item.ts).getTime()
      const key = Math.floor(tsMs / bucketMs) * bucketMs
      bucketMap.set(key, (bucketMap.get(key) || 0) + (item.count || 0))
    })

    const sortedKeys = Array.from(bucketMap.keys()).sort((prev, next) => prev - next)

    let maxValue = 0
    sortedKeys.forEach((key) => {
      const val = bucketMap.get(key)
      if (val > maxValue) maxValue = val
    })

    const seriesNames = ['count']

    // Format X-axis labels in the user's timezone.
    // We use 'category' axis instead of 'timeseries' so that C3/d3 doesn't
    // reposition bars using its own UTC-based time scale.
    const xLabels = sortedKeys.map((key) => {
      const date = new Date(key)
      const dur = duration
      if (dur > 7 * DAY) {
        return formatDateInTimezone(date, { month: '2-digit', day: '2-digit', hour12: false })
      } else if (dur > DAY) {
        return formatDateInTimezone(date, {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      } else {
        return formatDateInTimezone(date, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      }
    })

    const xColumn = ['x', ...xLabels]
    const countColumn = ['count', ...sortedKeys.map((key) => bucketMap.get(key) || 0)]

    return {
      columns: [xColumn, countColumn],
      groups: [seriesNames],
      seriesNames,
      maxValue
    }
  })

  const totalEvents = computed(() => {
    if (!props.data?.length) return 0
    return props.data.reduce((sum, item) => sum + (item.count || 0), 0)
  })

  const formattedTotal = computed(() => {
    return new Intl.NumberFormat('en-US').format(totalEvents.value)
  })

  const formatNumber = (num) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return String(Math.round(num))
  }

  /**
   * Calculate a "nice" Y-axis maximum that produces clean tick labels.
   * Rounds up to the nearest power-of-10 multiple (1, 2, 5 pattern).
   */
  const niceYMax = (maxValue) => {
    if (maxValue <= 0) return 5
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
    const normalized = maxValue / magnitude
    let niceMultiplier
    if (normalized <= 1) niceMultiplier = 1
    else if (normalized <= 2) niceMultiplier = 2
    else if (normalized <= 5) niceMultiplier = 5
    else niceMultiplier = 10
    return niceMultiplier * magnitude
  }

  /**
   * Format a Date for the chart axis / tooltip respecting the user timezone.
   * Uses the same approach as getCurrentTimezone() in account-timezone.js.
   */
  const formatDateInTimezone = (date, opts) => {
    const tz = props.userTimezone
    try {
      return date.toLocaleString('en-US', { ...opts, timeZone: tz }).replace(',', '')
    } catch {
      // Fallback: browser local timezone
      return date.toLocaleString('en-US', opts).replace(',', '')
    }
  }

  // Build chart config
  const buildChartConfig = () => {
    if (!chartData.value.columns.length || !chartRef.value) return null

    const config = chartConfig.value
    const { columns, groups, seriesNames, maxValue } = chartData.value

    // Nice Y-axis scale
    const yMax = niceYMax(maxValue)

    // Colors: use DS tokens from c3.scss (--series-one-color, etc.)
    const colors = {}
    seriesNames.forEach((name, index) => {
      colors[name] = SERIES_COLORS[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    })

    // Labels
    const names = {}
    seriesNames.forEach((name) => {
      names[name] = config.seriesLabels?.[name] || name
    })

    /* eslint-disable id-length */
    return {
      bindto: chartRef.value,
      data: {
        x: 'x',
        columns,
        type: 'bar',
        groups,
        colors,
        names,
        order: 'desc'
      },
      axis: {
        x: {
          type: 'category',
          tick: {
            multiline: false,
            culling: { max: 12 }
          },
          height: 28
        },
        y: {
          max: yMax,
          min: 0,
          padding: { top: 10, bottom: 0 },
          tick: {
            count: 5,
            format: formatNumber
          }
        }
      },
      legend: {
        show: true,
        position: 'bottom',
        equally: true
      },
      tooltip: {
        grouped: true,
        format: {
          value: (val) => `${formatNumber(val)} events`
        }
      },
      bar: { width: { ratio: 0.92 } },
      padding: { left: 50, right: 15, top: 10, bottom: 5 },
      grid: { y: { show: true } },
      point: { show: false },
      transition: { duration: 150 }
    }
    /* eslint-enable id-length */
  }

  const initChart = () => {
    nextTick(() => {
      if (!chartRef.value) return
      const c3Config = buildChartConfig()
      if (!c3Config) return

      if (chartInstance.value) {
        try {
          chartInstance.value.destroy()
        } catch (_err) {
          /* c3 destroy may throw if already disposed */
        }
        chartInstance.value = null
      }

      chartInstance.value = c3.generate(c3Config)
    })
  }

  // Brush handlers
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
      const startPercent = Math.min(dragStartX.value, dragEndX.value) / width
      const endPercent = Math.max(dragStartX.value, dragEndX.value) / width

      if (Math.abs(endPercent - startPercent) > 0.05 && props.tsRangeBegin && props.tsRangeEnd) {
        const begin = new Date(props.tsRangeBegin).getTime()
        const end = new Date(props.tsRangeEnd).getTime()
        const range = end - begin

        emit('brush-select', {
          begin: new Date(begin + startPercent * range),
          end: new Date(begin + endPercent * range)
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

  // Emit the Metrics-based total to the parent whenever it changes
  watch(totalEvents, (val) => emit('total-computed', val))

  // Watchers
  watch(() => props.data, initChart, { deep: true })
  watch(() => [props.tsRangeBegin, props.tsRangeEnd], initChart)
  // Re-init when timezone changes so axis labels update
  watch(() => props.userTimezone, initChart)
  // Re-init when loading finishes — chartRef only exists in DOM after isLoading becomes false
  watch(
    () => props.isLoading,
    (loading, wasLoading) => {
      if (wasLoading && !loading) {
        initChart()
      }
    }
  )

  onMounted(initChart)

  onBeforeUnmount(() => {
    if (chartInstance.value) {
      try {
        chartInstance.value.destroy()
      } catch (_err) {
        /* c3 destroy may throw if already disposed */
      }
    }
  })

  defineExpose({ refresh: initChart })
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
      <span class="chart-header__hint">Drag to zoom</span>
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
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-section);
  }

  .chart-header__count {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .chart-header__total {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .chart-header__label {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
  }

  .chart-header__hint {
    font-size: 0.625rem;
    color: var(--text-color-secondary);
    opacity: 0.7;
    font-style: italic;
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

  /* C3 overrides — use DS tokens from c3.scss */
  :deep(.c3) {
    font-size: 10px;
    font-family: var(--font-family);
  }

  :deep(.c3 .c3-axis-x .tick text) {
    fill: var(--text-color-secondary) !important;
    font-size: 9px;
  }

  :deep(.c3 .c3-axis-y .tick text) {
    fill: var(--text-color-secondary) !important;
    font-size: 9px;
  }

  :deep(.c3 .domain) {
    stroke: var(--surface-border);
  }

  :deep(.c3 .tick line) {
    stroke: var(--surface-border);
  }

  :deep(.c3 .c3-axis path, .c3 .c3-axis line) {
    stroke: var(--surface-border) !important;
  }

  :deep(.c3-grid line) {
    stroke: var(--surface-border);
    stroke-dasharray: 2, 2;
    opacity: 0.3;
  }

  :deep(.c3-legend-item) {
    cursor: pointer;
    font-size: 10px;
  }

  :deep(.c3-legend-item text) {
    fill: var(--text-color);
  }

  :deep(.c3-legend-item-hidden) {
    opacity: 0.15;
  }

  :deep(.c3-bar) {
    stroke-width: 0;
  }

  :deep(.c3-tooltip-container) {
    background-color: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
  }
</style>
