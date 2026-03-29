<script setup>
  import { computed, ref } from 'vue'

  defineOptions({ name: 'EventHistogram' })

  const props = defineProps({
    data: {
      type: Array,
      default: () => []
    },
    tsRangeBegin: {
      type: [Date, String],
      default: null
    },
    tsRangeEnd: {
      type: [Date, String],
      default: null
    },
    bucketCount: {
      type: Number,
      default: 40
    }
  })

  const emit = defineEmits(['brush-select'])

  const containerRef = ref(null)
  const isDragging = ref(false)
  const dragStartIdx = ref(null)
  const dragEndIdx = ref(null)
  const hoveredBar = ref(null)
  const tooltipX = ref(0)
  const tooltipY = ref(0)

  const CHART_HEIGHT = 48
  const BAR_GAP = 1

  const rangeBegin = computed(() => {
    if (!props.tsRangeBegin) return null
    return new Date(props.tsRangeBegin).getTime()
  })

  const rangeEnd = computed(() => {
    if (!props.tsRangeEnd) return null
    return new Date(props.tsRangeEnd).getTime()
  })

  const buckets = computed(() => {
    if (!props.data.length || !rangeBegin.value || !rangeEnd.value) {
      return new Array(props.bucketCount).fill(0)
    }

    const begin = rangeBegin.value
    const end = rangeEnd.value
    const range = end - begin
    if (range <= 0) return new Array(props.bucketCount).fill(0)

    const bucketSize = range / props.bucketCount
    const result = new Array(props.bucketCount).fill(0)

    props.data.forEach((row) => {
      if (!row.ts) return
      const timestamp = new Date(row.ts).getTime()
      if (timestamp < begin || timestamp > end) return
      const bucketIndex = Math.min(
        Math.floor((timestamp - begin) / bucketSize),
        props.bucketCount - 1
      )
      result[bucketIndex]++
    })

    return result
  })

  const maxBucketValue = computed(() => {
    return Math.max(...buckets.value, 1)
  })

  const bars = computed(() => {
    return buckets.value.map((count, index) => {
      const heightPercent = count > 0 ? Math.max((count / maxBucketValue.value) * 100, 3) : 0
      return {
        index,
        count,
        heightPercent
      }
    })
  })

  const totalEvents = computed(() => {
    return new Intl.NumberFormat('en-US').format(props.data.length)
  })

  // Time axis labels (show ~5 labels)
  const timeLabels = computed(() => {
    if (!rangeBegin.value || !rangeEnd.value) return []
    const begin = rangeBegin.value
    const end = rangeEnd.value
    const labelCount = 5
    const labels = []
    for (let idx = 0; idx <= labelCount; idx++) {
      const fraction = idx / labelCount
      const ts = new Date(begin + fraction * (end - begin))
      labels.push({
        position: fraction * 100,
        label: ts.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        })
      })
    }
    return labels
  })

  const getBucketTimeRange = (bucketIndex) => {
    if (!rangeBegin.value || !rangeEnd.value) return { start: '', end: '' }
    const begin = rangeBegin.value
    const end = rangeEnd.value
    const range = end - begin
    const bucketSize = range / props.bucketCount
    const bucketStart = new Date(begin + bucketIndex * bucketSize)
    const bucketEnd = new Date(begin + (bucketIndex + 1) * bucketSize)

    const formatTime = (date) =>
      date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    return { start: formatTime(bucketStart), end: formatTime(bucketEnd) }
  }

  // Brush selection
  const getBucketFromMouseEvent = (event) => {
    if (!containerRef.value) return 0
    const chartArea = containerRef.value.querySelector('[data-chart-area]')
    if (!chartArea) return 0
    const rect = chartArea.getBoundingClientRect()
    const relativeX = (event.clientX - rect.left) / rect.width
    return Math.max(0, Math.min(props.bucketCount - 1, Math.floor(relativeX * props.bucketCount)))
  }

  const handleMouseDown = (event) => {
    isDragging.value = true
    dragStartIdx.value = getBucketFromMouseEvent(event)
    dragEndIdx.value = dragStartIdx.value
  }

  const handleMouseMove = (event) => {
    // Update tooltip position
    if (containerRef.value) {
      const chartArea = containerRef.value.querySelector('[data-chart-area]')
      if (chartArea) {
        const rect = chartArea.getBoundingClientRect()
        const relativeX = (event.clientX - rect.left) / rect.width
        const barIdx = Math.max(
          0,
          Math.min(props.bucketCount - 1, Math.floor(relativeX * props.bucketCount))
        )
        hoveredBar.value = barIdx
        tooltipX.value = event.clientX - rect.left
        tooltipY.value = event.clientY - rect.top - 10
      }
    }

    if (!isDragging.value) return
    dragEndIdx.value = getBucketFromMouseEvent(event)
  }

  const handleMouseUp = () => {
    if (!isDragging.value) return
    isDragging.value = false

    if (dragStartIdx.value === null || dragEndIdx.value === null) return

    const startBucket = Math.min(dragStartIdx.value, dragEndIdx.value)
    const endBucket = Math.max(dragStartIdx.value, dragEndIdx.value)

    if (startBucket === endBucket) {
      dragStartIdx.value = null
      dragEndIdx.value = null
      return
    }

    const begin = rangeBegin.value
    const end = rangeEnd.value
    const range = end - begin
    const bucketSize = range / props.bucketCount

    const newBegin = new Date(begin + startBucket * bucketSize)
    const newEnd = new Date(begin + (endBucket + 1) * bucketSize)

    emit('brush-select', { begin: newBegin, end: newEnd })

    dragStartIdx.value = null
    dragEndIdx.value = null
  }

  const handleMouseLeave = () => {
    hoveredBar.value = null
    if (isDragging.value) {
      isDragging.value = false
      dragStartIdx.value = null
      dragEndIdx.value = null
    }
  }

  const selectionLeft = computed(() => {
    if (dragStartIdx.value === null || dragEndIdx.value === null) return null
    const startIdx = Math.min(dragStartIdx.value, dragEndIdx.value)
    return `${(startIdx / props.bucketCount) * 100}%`
  })

  const selectionWidth = computed(() => {
    if (dragStartIdx.value === null || dragEndIdx.value === null) return null
    const startIdx = Math.min(dragStartIdx.value, dragEndIdx.value)
    const endIdx = Math.max(dragStartIdx.value, dragEndIdx.value)
    return `${((endIdx - startIdx + 1) / props.bucketCount) * 100}%`
  })

  const isBarInSelection = (barIndex) => {
    if (dragStartIdx.value === null || dragEndIdx.value === null) return false
    const startIdx = Math.min(dragStartIdx.value, dragEndIdx.value)
    const endIdx = Math.max(dragStartIdx.value, dragEndIdx.value)
    return barIndex >= startIdx && barIndex <= endIdx
  }
</script>

<template>
  <div
    v-if="data.length > 0"
    ref="containerRef"
    class="w-full select-none border surface-border rounded-md overflow-hidden"
    style="background: var(--surface-section)"
    data-testid="event-histogram"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b surface-border">
      <span class="text-xs font-medium text-color-secondary">
        <span class="text-color">{{ totalEvents }}</span> events
      </span>
      <span class="text-xs text-color-secondary italic"> Drag to zoom </span>
    </div>

    <!-- Chart area -->
    <div
      class="relative px-3 pt-2 pb-1 cursor-crosshair"
      :style="{ height: CHART_HEIGHT + 28 + 'px' }"
      data-chart-area
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <!-- Grid lines (subtle) -->
      <div
        class="absolute left-3 right-3 border-b border-dashed"
        style="border-color: var(--surface-border); top: calc(25% + 8px); opacity: 0.5"
      />
      <div
        class="absolute left-3 right-3 border-b border-dashed"
        style="border-color: var(--surface-border); top: calc(50% + 8px); opacity: 0.5"
      />
      <div
        class="absolute left-3 right-3 border-b border-dashed"
        style="border-color: var(--surface-border); top: calc(75% + 8px); opacity: 0.5"
      />

      <!-- Bars -->
      <div
        class="flex items-end w-full"
        :style="{ height: CHART_HEIGHT + 'px', gap: BAR_GAP + 'px' }"
      >
        <div
          v-for="bar in bars"
          :key="bar.index"
          class="histogram-bar flex-1 rounded-t-sm transition-opacity duration-100"
          :class="{
            'opacity-100': hoveredBar === bar.index || isBarInSelection(bar.index),
            'opacity-70': hoveredBar !== bar.index && !isBarInSelection(bar.index)
          }"
          :style="{
            height: bar.count > 0 ? bar.heightPercent + '%' : '0px',
            minHeight: bar.count > 0 ? '2px' : '0px'
          }"
          :data-testid="'histogram-bar-' + bar.index"
        />
      </div>

      <!-- Selection overlay -->
      <div
        v-if="selectionLeft !== null"
        class="absolute top-2 rounded-sm pointer-events-none"
        :style="{
          left: `calc(12px + ${selectionLeft})`,
          width: selectionWidth,
          height: CHART_HEIGHT + 'px',
          background: 'var(--primary-color)',
          opacity: 0.15
        }"
        data-testid="event-histogram-selection"
      />

      <!-- Tooltip -->
      <div
        v-if="hoveredBar !== null && !isDragging"
        class="absolute z-10 pointer-events-none px-2 py-1 rounded text-xs shadow-md"
        style="
          background: var(--surface-overlay);
          color: var(--text-color);
          border: 1px solid var(--surface-border);
          transform: translateX(-50%) translateY(-100%);
          white-space: nowrap;
        "
        :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
      >
        <span class="font-medium">{{ bars[hoveredBar]?.count || 0 }}</span> events
        <span class="text-color-secondary ml-1">
          {{ getBucketTimeRange(hoveredBar).start }} –
          {{ getBucketTimeRange(hoveredBar).end }}
        </span>
      </div>
    </div>

    <!-- Time axis -->
    <div
      class="relative px-3 pb-2"
      style="height: 18px"
    >
      <div
        v-for="(tick, idx) in timeLabels"
        :key="idx"
        class="absolute text-xs text-color-secondary"
        :style="{
          left: `calc(12px + ${tick.position}%)`,
          transform: 'translateX(-50%)'
        }"
      >
        {{ tick.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
  .histogram-bar {
    background-color: var(--series-one-color, #fba86f);
  }
</style>
