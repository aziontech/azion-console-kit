<script setup>
  import c3 from 'c3'
  import { onMounted, computed } from 'vue'
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

  const getClassToLargeTooltip = computed(() => {
    if (props.chartData?.id === '357842851576414809') {
      return 'large-tooltip'
    }
    return ''
  })
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :class="getClassToLargeTooltip"
    :id="`line-chart-${props.chartData?.id}`"
  />
</template>

<style>
  .large-tooltip .c3-tooltip-container {
    max-height: 400px !important;
    max-width: 100% !important;
  }

  .large-tooltip .c3-tooltip tbody {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    max-height: 400px;
    gap: 5px;
  }
</style>
