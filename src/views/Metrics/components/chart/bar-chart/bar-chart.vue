<script setup>
  import c3 from 'c3'
  import FormatC3GraphProps from '../../../helpers/c3-charts'
  import { onMounted } from 'vue'

  const props = defineProps({
    chartData: Object,
    resultChart: Array,
    hasMeanLine: Boolean
  })

  onMounted(() => {
    generateGraph()
  })

  const generateGraph = () => {
    const c3Props = FormatC3GraphProps({
      chartData: props.chartData,
      resultChart: props.resultChart,
      hasMeanLine: props.hasMeanLine
    })

    c3.generate({
      bindto: `#bar-chart-${props.chartData?.id}`,
      ...c3Props
    })
  }
</script>

<template>
  <div
    class="bar-chart"
    :id="`bar-chart-${props.chartData?.id}`"
    data-testid="barChart"
  ></div>
</template>

<style lang="scss">
  .bar-chart > svg {
    display: flex;
    width: auto;
  }
</style>
