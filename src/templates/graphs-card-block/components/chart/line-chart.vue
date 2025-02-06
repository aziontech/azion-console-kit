<script setup>
  import c3 from 'c3'
  import { onMounted } from 'vue'
  import { FormatC3GraphProps } from '@modules/real-time-metrics/chart'

  const props = defineProps({
    chartData: Object,
    resultChart: Array,
    hasMeanLineTotal: Boolean,
    hasMeanLineSeries: Boolean
  })

  onMounted(() => {
    generateGraph()
  })

  const generateGraph = () => {
    const c3Props = FormatC3GraphProps({
      chartData: props.chartData,
      resultChart: props.resultChart,
      hasMeanLineTotal: props.hasMeanLineTotal,
      hasMeanLineSeries: props.hasMeanLineSeries
    })

    c3.generate({
      bindto: `#line-chart-${props.chartData?.id}`,
      ...c3Props
    })
  }
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`line-chart-${props.chartData?.id}`"
  />
</template>

<style>
  .c3-tooltip-container {
    max-height: 400px !important;
  }
</style>
