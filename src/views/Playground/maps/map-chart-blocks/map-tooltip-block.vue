<template>
  <div
    v-if="data?.kind"
    class="absolute surface-card rounded border surface-border px-4 py-3 pointer-events-none"
    :style="`top: ${data?.yAxis}px; left: ${data?.xAxis}px; transform: translate(-50%, -100%)`"
  >
    <component
      :is="COMPONENTS[data.kind]"
      :data="data"
    />
  </div>
</template>

<script setup>
  import { defineAsyncComponent } from 'vue'

  defineProps({
    data: {
      type: Object,
      default: () => {}
    }
  })

  const COMPONENTS = {
    heatmap: defineAsyncComponent(() => import('./map-tooltip-contents/heatmap-tooltip.vue'))
  }
</script>
