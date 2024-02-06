<script setup>
  import c3 from 'c3'
  import { onMounted } from 'vue'
  import FormatC3GraphProps from '../../../helpers/c3-charts'

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
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`bar-chart-${props.chartData?.id}`"
  />
</template>
../../../helpers/c3-charts
