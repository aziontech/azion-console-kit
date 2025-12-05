<template>
  <div
    ref="root"
    class="resizable-splitter w-full flex min-h-0 overflow-hidden select-none"
    :class="{ 'flex-col': isHorizontal, 'flex-row': !isHorizontal }"
    @mouseleave="onPointerUp"
  >
    <div
      class="panel-a min-w-0 min-h-0 flex-none"
      :class="{ 'w-full': isHorizontal, 'h-full': !isHorizontal }"
      :style="panelAStyle"
    >
      <slot name="panel-a" />
    </div>

    <div
      ref="handle"
      class="handle flex items-center justify-center group flex-none"
      :class="handleClass"
      @mousedown.prevent="onPointerDown"
      @touchstart.passive="onPointerDown"
    >
      <div :class="barOuterClass">
        <span :class="barInnerClass"></span>
      </div>
    </div>

    <div
      class="panel-b flex-1 min-h-0 min-w-0"
      :class="{ 'w-full': isHorizontal, 'h-full': !isHorizontal }"
      :style="panelBStyle"
    >
      <slot name="panel-b" />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
  const props = defineProps({
    panelSizes: {
      type: Array,
      default: () => [70, 30]
    },
    // Direction: 'horizontal' (top-bottom) or 'vertical' (left-right)
    direction: {
      type: String,
      default: 'horizontal',
      validator: (val) => ['horizontal', 'vertical'].includes(val)
    },
    minSize: {
      type: Array,
      default: () => [10, 10] // percentages
    },
    maxSize: {
      type: Array,
      default: () => [95, 95] // percentages
    },
    // Optional initial height for the top panel (panel-a)
    // If both are provided, initialTopPanelPixels has priority over initialTopPanelPercent
    initialTopPanelPercent: {
      type: Number,
      default: null // percent
    },
    initialTopPanelPixels: {
      type: Number,
      default: null // pixels
    }
  })
  const emit = defineEmits(['update:panelSizes', 'resizeend'])
  const root = ref(null)
  const handle = ref(null)
  const isDragging = ref(false)
  const isHorizontal = computed(() => props.direction === 'horizontal')
  const currentSizes = ref([props.panelSizes[0], props.panelSizes[1]])
  let hasAppliedInitial = false
  let resizeObserver = null
  watch(
    () => props.panelSizes,
    (val) => {
      if (Array.isArray(val) && val.length === 2) {
        currentSizes.value = [Number(val[0]) || 0, Number(val[1]) || 0]
      }
    },
    { immediate: true, deep: true }
  )
  const clampPair = (desiredA) => {
    const minA = Number(props.minSize?.[0] ?? 0)
    const minB = Number(props.minSize?.[1] ?? 0)
    const maxA = Number(props.maxSize?.[0] ?? 100)
    const maxB = Number(props.maxSize?.[1] ?? 100)
    // Start from desired A, then derive B to keep total 100
    let sizeA = desiredA
    // A cannot be less than minA or more than maxA, and must leave at least minB for B
    sizeA = Math.min(Math.max(sizeA, minA), Math.min(maxA, 100 - minB))
    let sizeB = 100 - sizeA
    // Enforce B max
    if (sizeB > maxB) {
      sizeB = maxB
      sizeA = 100 - sizeB
    }
    // Re-enforce A bounds after B adjust
    if (sizeA < minA) {
      sizeA = minA
      sizeB = 100 - sizeA
    }
    if (sizeA > maxA) {
      sizeA = maxA
      sizeB = 100 - sizeA
    }
    // Enforce B min finally
    if (sizeB < minB) {
      sizeB = minB
      sizeA = 100 - sizeB
    }
    return [sizeA, sizeB]
  }
  const panelAStyle = computed(() => {
    if (isHorizontal.value) {
      return { height: `${currentSizes.value[0]}%` }
    }
    // Vertical: compute pixel width excluding handle thickness
    const rect = root.value?.getBoundingClientRect()
    if (!rect) {
      // Fallback early: use percent to avoid layout jump before mount/visibility
      return { width: `${currentSizes.value[0]}%` }
    }
    const handleW = Number(handle.value?.offsetWidth || 0)
    const contentW = Math.max(rect.width - handleW, 0)
    // Interpret percentage as a share of TOTAL width (including handle)
    const totalW = contentW + handleW
    const desiredPx = (currentSizes.value[0] / 100) * totalW
    const widthPx = Math.round(Math.max(0, Math.min(desiredPx, contentW)))
    return { width: `${widthPx}px` }
  })
  const panelBStyle = computed(() => {
    if (isHorizontal.value) {
      return { height: `${currentSizes.value[1]}%` }
    }
    // Vertical: let panel-b flex to occupy remaining space; avoid explicit width to prevent growth loops
    return {}
  })

  const handleClass = computed(() => ({
    'w-full h-6 cursor-row-resize': isHorizontal.value,
    'h-full w-6 cursor-col-resize': !isHorizontal.value
  }))

  const barOuterClass = computed(() => ({
    'w-full h-0.5 group-hover:h-1 bg-[var(--surface-300)] flex justify-center transition-all duration-200 ease-in-out':
      isHorizontal.value,
    'h-full w-0.5 group-hover:w-1 bg-[var(--surface-300)] flex items-center transition-all duration-200 ease-in-out':
      !isHorizontal.value
  }))

  const barInnerClass = computed(() => ({
    'w-6 h-full bg-[var(--surface-500)] transition-colors duration-200 ease-in-out':
      isHorizontal.value,
    'h-6 w-full bg-[var(--surface-500)] transition-colors duration-200 ease-in-out':
      !isHorizontal.value
  }))
  let startY = 0
  let startX = 0
  let startHeights = [0, 0]
  const onPointerDown = (event) => {
    isDragging.value = true
    const point = event.touches ? event.touches[0] : event
    startY = point.clientY || 0
    startX = point.clientX || 0
    startHeights = [currentSizes.value[0], currentSizes.value[1]]
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('touchend', onPointerUp)
  }
  const onPointerMove = (event) => {
    if (!isDragging.value || !root.value) return
    const rect = root.value.getBoundingClientRect()
    const point = event.touches ? event.touches[0] : event
    const clientY = point.clientY
    const clientX = point.clientX
    const deltaPx = isHorizontal.value ? clientY - startY : clientX - startX
    const handleW = Number(handle.value?.offsetWidth || 0)
    const totalPx = isHorizontal.value ? rect.height : Math.max(rect.width - handleW, 0)
    const deltaPercent = (deltaPx / totalPx) * 100
    const desiredA = startHeights[0] + deltaPercent
    const [newA, newB] = clampPair(desiredA)
    currentSizes.value = [newA, newB]
    emit('update:panelSizes', [newA, newB])
  }
  const onPointerUp = async () => {
    if (!isDragging.value) return
    isDragging.value = false
    window.removeEventListener('mousemove', onPointerMove)
    window.removeEventListener('mouseup', onPointerUp)
    window.removeEventListener('touchmove', onPointerMove)
    window.removeEventListener('touchend', onPointerUp)
    await nextTick()
    emit('resizeend', { sizes: [...currentSizes.value] })
  }
  const applyInitialSizes = async () => {
    await nextTick()
    let desiredA = Number(currentSizes.value[0]) || 0
    const rect = root.value?.getBoundingClientRect()
    const pxVal = props.initialTopPanelPixels
    const pctVal = props.initialTopPanelPercent
    if (pxVal != null && rect) {
      const basis = isHorizontal.value ? rect.height : rect.width
      if (basis > 0) desiredA = (Number(pxVal) / basis) * 100
    } else if (pctVal != null) {
      desiredA = Number(pctVal)
    }
    const [sizeA, sizeB] = clampPair(desiredA)
    currentSizes.value = [sizeA, sizeB]
    emit('update:panelSizes', [sizeA, sizeB])
    emit('resizeend', { sizes: [sizeA, sizeB] })
    hasAppliedInitial = true
  }
  onMounted(() => {
    applyInitialSizes()
    // Re-apply once when the element becomes visible and has dimensions (e.g., after tab switch)
    if ('ResizeObserver' in window && root.value) {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        const cr = entry?.contentRect
        if (!hasAppliedInitial && cr && (cr.width > 0 || cr.height > 0)) {
          applyInitialSizes()
        }
      })
      resizeObserver.observe(root.value)
    }
  })
  watch(
    () => props.direction,
    async () => {
      await nextTick()
      applyInitialSizes()
    }
  )
  watch(
    () => [props.initialTopPanelPercent, props.initialTopPanelPixels],
    async () => {
      await nextTick()
      applyInitialSizes()
    }
  )
  onBeforeUnmount(() => {
    onPointerUp()
    if (resizeObserver && root.value) {
      // Safely cleanup ResizeObserver without empty catch blocks
      const el = root.value
      if (typeof resizeObserver.unobserve === 'function' && el) {
        resizeObserver.unobserve(el)
      }
      if (typeof resizeObserver.disconnect === 'function') {
        resizeObserver.disconnect()
      }
      resizeObserver = null
    }
  })
</script>
<style scoped>
  .resizable-splitter {
    --handle-bg: transparent;
  }
  .handle {
    background: var(--handle-bg);
  }
</style>
