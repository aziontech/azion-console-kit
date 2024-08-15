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
    heatmap: defineAsyncComponent(() => import('./map-tooltip-contents/heatmap-tooltip.vue'))
  }

  const mapTooltipRef = ref(null)

  const tooltipStyle = computed(() => {
    const parent = mapTooltipRef.value?.parentElement
    if (!parent) {
      return {}
    }

    const { xAxis, yAxis } = props.data
    const positions = {
      top: `${yAxis}px`,
      left: `${xAxis}px`
    }

    const { offsetHeight: parentHeight, offsetWidth: parentWidth } = parent
    const { offsetHeight: tooltipHeight, offsetWidth: tooltipWidth } = mapTooltipRef.value

    if (xAxis - tooltipWidth / 2 < 0) {
      positions.left = '0px'
    }

    if (xAxis + tooltipWidth / 2 > parentWidth) {
      positions.left = `${parentWidth - tooltipWidth}px`
    }

    return positions
  })
</script>
