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
    }
  })

  const emit = defineEmits(['brush-select'])

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

  const DEFAULT_COLORS = [
    'var(--series-one-color)',
    'var(--series-two-color)',
    'var(--series-three-color)',
    'var(--series-four-color)',
    'var(--series-five-color)'
  ]

  const chartConfig = computed(() => getChartConfig(props.configKey))

  // Transform data for C3.js
  const chartData = computed(() => {
    if (!props.data?.length || !chartConfig.value) {
      return { columns: [], groups: [], seriesNames: [], maxValue: 0 }
    }

    const config = chartConfig.value
    const rawData = config.transformData ? config.transformData(props.data) : props.data

    const timestampMap = new Map()
    const seriesSet = new Set()
    const stackField = config.stackField

    rawData.forEach((item) => {
      const ts = item.ts
      if (!ts) return

      const seriesName = stackField ? item[stackField] : 'count'
      if (stackField && seriesName) {
        seriesSet.add(seriesName)
      }

      if (!timestampMap.has(ts)) {
        timestampMap.set(ts, { ts, total: 0 })
      }
      const bucket = timestampMap.get(ts)
      bucket[seriesName || 'count'] = item.count || 0
      bucket.total += item.count || 0
    })

    const sortedTimestamps = Array.from(timestampMap.keys()).sort()

    let maxValue = 0
    sortedTimestamps.forEach((ts) => {
      const bucket = timestampMap.get(ts)
      if (bucket.total > maxValue) maxValue = bucket.total
    })

    let seriesNames = stackField ? Array.from(seriesSet) : ['count']
    // Order status codes properly (2xx, 3xx, 4xx, 5xx)
    if (stackField === 'status' || stackField === 'statusRange') {
      const statusOrder = ['2xx', '3xx', '4xx', '5xx']
      seriesNames = statusOrder.filter((status) => seriesSet.has(status))
      // Add any other series not in the standard order
      seriesSet.forEach((status) => {
        if (!statusOrder.includes(status) && !seriesNames.includes(status)) {
          seriesNames.push(status)
        }
      })
    }

    const xColumn = ['x', ...sortedTimestamps.map((ts) => new Date(ts))]
    const seriesColumns = seriesNames.map((name) => [
      name,
      ...sortedTimestamps.map((ts) => timestampMap.get(ts)?.[name] || 0)
    ])

    return {
      columns: [xColumn, ...seriesColumns],
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
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return String(num)
  }

  // Build chart config
  const buildChartConfig = () => {
    if (!chartData.value.columns.length || !chartRef.value) return null

    const config = chartConfig.value
    const { columns, groups, seriesNames, maxValue } = chartData.value

    // Round up to nice number
    const niceMax = Math.ceil(maxValue / 5) * 5 || 5

    // Colors using CSS variables
    const colors = {}
    seriesNames.forEach((name, index) => {
      colors[name] = SERIES_COLORS[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    })

    // Labels
    const names = {}
    seriesNames.forEach((name) => {
      names[name] = config.seriesLabels?.[name] || name
    })

    // Time format
    let timeFormat = '%H:%M'
    if (props.tsRangeBegin && props.tsRangeEnd) {
      const duration = new Date(props.tsRangeEnd) - new Date(props.tsRangeBegin)
      if (duration > DAY) timeFormat = '%m/%d %H:%M'
      if (duration > 7 * DAY) timeFormat = '%m/%d'
    }

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
          type: 'timeseries',
          tick: {
            format: timeFormat,
            multiline: false,
            culling: { max: 12 }
          },
          height: 28
        },
        y: {
          max: niceMax,
          min: 0,
          padding: { top: 0, bottom: 0 },
          tick: {
            count: 4,
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
          title: (date) =>
            date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
          value: (val) => `${formatNumber(val)} events`
        }
      },
      bar: { width: { ratio: 0.85 } },
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

  // Watchers
  watch(() => props.data, initChart, { deep: true })
  watch(() => [props.tsRangeBegin, props.tsRangeEnd], initChart)
  // Re-init when loading finishes — chartRef only exists in DOM after isLoading becomes false
  watch(() => props.isLoading, (loading, wasLoading) => {
    if (wasLoading && !loading) {
      initChart()
    }
  })

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

  /* C3 overrides */
  :deep(.c3) {
    font-size: 10px;
  }

  :deep(.c3 .c3-axis-x .tick text) {
    fill: var(--text-color-secondary);
    font-size: 9px;
  }

  :deep(.c3 .c3-axis-y .tick text) {
    fill: var(--text-color-secondary);
    font-size: 9px;
  }

  :deep(.c3 .domain) {
    stroke: var(--surface-border);
  }

  :deep(.c3 .tick line) {
    stroke: var(--surface-border);
  }

  :deep(.c3-grid line) {
    stroke: var(--surface-border);
    stroke-dasharray: 2, 2;
    opacity: 0.4;
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
</style>
