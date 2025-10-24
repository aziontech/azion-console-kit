<script setup>
  import c3 from 'c3'
  import { onMounted } from 'vue'
  import { FormatC3GraphProps } from '@modules/real-time-metrics/chart'

  const props = defineProps({
    chartData: Object,
    resultChart: Array
  })

  onMounted(() => {
    generateGraph()
  })

  const generateGraph = () => {
    const c3Props = FormatC3GraphProps({
      chartData: props.chartData,
      resultChart: filterEmptyValues(props.resultChart)
    })

    c3.generate({
      bindto: `#pie-chart-${props.chartData?.id}`,
      ...c3Props
    })
  }

  const filterEmptyValues = (data) => {
    return data.filter((item) => item[0] !== undefined && item[0] !== null)
  }
</script>

<template>
  <div
    class="[&>svg]:w-auto [&>svg]:flex"
    :id="`pie-chart-${props.chartData?.id}`"
  />
</template>
