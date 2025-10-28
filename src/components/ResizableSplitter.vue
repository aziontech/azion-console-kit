<template>
  <div
    ref="root"
    class="resizable-splitter w-full h-full flex flex-col select-none"
    @mouseleave="onPointerUp"
  >
    <div
      class="panel-a w-full"
      :style="panelAStyle"
    >
      <slot name="panel-a" />
    </div>

    <div
      ref="handle"
      class="handle w-full h-4 py-2 cursor-row-resize flex items-center justify-center"
      @mousedown.prevent="onPointerDown"
      @touchstart.passive="onPointerDown"
    >
      <div class="w-full h-full bg-black-500"></div>
    </div>

    <div
      class="panel-b w-full flex-1 min-h-0"
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
    minSize: {
      type: Array,
      default: () => [10, 10] // percentages
    },
    maxSize: {
      type: Array,
      default: () => [95, 95] // percentages
    },
    // Optional initial height for panel-a
    // If both are provided, initialAPx has priority over initialA
    initialA: {
      type: Number,
      default: null // percent
    },
    initialAPx: {
      type: Number,
      default: null // pixels
    }
  })

  const emit = defineEmits(['update:panelSizes', 'resizeend'])

  const root = ref(null)
  const isDragging = ref(false)
  const currentSizes = ref([props.panelSizes[0], props.panelSizes[1]])

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

  const panelAStyle = computed(() => ({ height: `${currentSizes.value[0]}%` }))
  const panelBStyle = computed(() => ({ height: `${currentSizes.value[1]}%` }))

  let startY = 0
  let startHeights = [0, 0]

  const onPointerDown = (event) => {
    isDragging.value = true
    startY = (event.touches ? event.touches[0].clientY : event.clientY) || 0
    startHeights = [currentSizes.value[0], currentSizes.value[1]]
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('touchend', onPointerUp)
  }

  const onPointerMove = (event) => {
    if (!isDragging.value || !root.value) return
    const rect = root.value.getBoundingClientRect()
    const clientY = event.touches ? event.touches[0].clientY : event.clientY
    const deltaPx = clientY - startY
    const deltaPercent = (deltaPx / rect.height) * 100
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

  onMounted(() => {
    let desiredA = currentSizes.value[0]
    const rect = root.value?.getBoundingClientRect()
    if (props.initialAPx != null && rect?.height > 0) {
      desiredA = (props.initialAPx / rect.height) * 100
    } else if (props.initialA != null) {
      desiredA = props.initialA
    }
    const [sizeA, sizeB] = clampPair(desiredA)
    currentSizes.value = [sizeA, sizeB]
    // notify parent so any watchers (e.g., monaco layout) can react
    emit('update:panelSizes', [sizeA, sizeB])
    emit('resizeend', { sizes: [sizeA, sizeB] })
  })

  onBeforeUnmount(() => {
    onPointerUp()
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
