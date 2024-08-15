<template>
  <div
    v-if="data?.kind"
    class="absolute surface-card rounded border surface-border px-4 py-3 pointer-events-none"
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
