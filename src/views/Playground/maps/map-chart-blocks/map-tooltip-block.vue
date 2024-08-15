<template>
  <div
    v-if="data?.kind"
    ref="mapTooltipRef"
    class="absolute surface-card rounded border surface-border px-4 py-3 pointer-events-none"
    :style="tooltipStyle"
  >
    <component
      :is="COMPONENTS[data.kind]"
      :data="data"
    />
  </div>
</template>

<script setup>
  import { defineAsyncComponent, ref, computed } from 'vue'

  const props = defineProps({
    data: {
      type: Object,
      default: () => {}
    }
  })

  const COMPONENTS = {
    heatmap: defineAsyncComponent(() => import('./map-tooltip-contents/heatmap-tooltip.vue')),
    bubble: defineAsyncComponent(() => import('./map-tooltip-contents/bubbles-tooltip.vue'))
  }

  const mapTooltipRef = ref(null)

  const tooltipStyle = computed(() => {
    const parent = mapTooltipRef.value?.parentElement
    if (!parent) {
      return {}
    }

    const OFFSET = 15

    const { xAxis, yAxis } = props.data
    const positions = {
      top: `${yAxis}px`,
      left: `${xAxis + OFFSET}px`
    }

    const { offsetHeight: parentHeight, offsetWidth: parentWidth } = parent
    const { offsetHeight: tooltipHeight, offsetWidth: tooltipWidth } = mapTooltipRef.value

    if (xAxis + tooltipWidth / 2 > parentWidth) {
      positions.left = `${parentWidth - tooltipWidth}px`
    }

    if (xAxis > parentWidth - (tooltipWidth + OFFSET)) {
      positions.right = `${parentWidth - xAxis + OFFSET}px`
      positions.left = 'auto'
    }

    if (yAxis + tooltipHeight / 2 > parentHeight) {
      positions.top = `${parentHeight - tooltipHeight}px`
    }

    return positions
  })
</script>
