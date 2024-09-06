<template>
  <div class="flex flex-col gap-2 text-color text-xs font-normal">
    <p>{{ data?.label }}</p>
    <div class="flex justify-between">
      <p>eeeeeeeeeeeeeeeeeeeeeee{{ fieldName }} :</p>
      <p>{{ value }}</p>
    </div>
  </div>
</template>

<script setup>
  import { formatYAxisLabels, camelToTitle } from '@modules/real-time-metrics/chart'
  import { computed } from 'vue'
  const props = defineProps({
    data: {
      type: Object,
      default: () => {}
    }
  })

  const value = computed(() => formatYAxisLabels(props.data?.value, props.data?.chartData))
  const fieldName = computed(() => camelToTitle(props.data?.chartData.fields[0]))
</script>
