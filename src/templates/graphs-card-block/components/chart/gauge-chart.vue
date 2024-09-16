<script setup>
  import { onMounted } from 'vue'
  import c3 from 'c3'
  import { FormatC3GraphProps } from '@modules/real-time-metrics/chart'

  onMounted(() => {
    generate()
  })

  const props = defineProps({
    resultChart: {
      type: Array,
      default: () => []
    },
    chartData: Object
  })

  const generate = () => {
    const c3Props = FormatC3GraphProps({
      chartData: props.chartData,
      resultChart: props.resultChart
    })

    c3.generate({
      bindto: `#gauge-chart-${props.chartData?.id}`,
      ...c3Props
    })
  }
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`gauge-chart-${props.chartData?.id}`"
  />
</template>
