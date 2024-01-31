<script setup>
  import c3 from 'c3'
  import FormatC3GraphProps from '../../../helpers/c3-charts'
  import { onMounted } from 'vue'

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
    class="line-chart"
    :id="`line-chart-${props.chartData?.id}`"
    data-testid="lineChart"
  ></div>
</template>

<style lang="scss">
  .line-chart {
    & > svg {
      display: flex;
      width: auto;
    }
  }
</style>
