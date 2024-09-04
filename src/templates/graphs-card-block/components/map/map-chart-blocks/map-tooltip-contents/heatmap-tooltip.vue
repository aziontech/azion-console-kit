<template>
  <div class="flex gap-2 justify-between text-color text-xs font-normal">
    <p>{{ data?.label }}</p>
    <p>{{ value }}</p>
  </div>
</template>

<script setup>
  import { formatYAxisLabels } from '@modules/real-time-metrics/chart'
  import { computed } from 'vue'
  const props = defineProps({
    data: {
      type: Object,
      default: () => {}
    }
  })

  const value = computed(() => formatYAxisLabels(props.data?.value, props.data?.chartData))
</script>
