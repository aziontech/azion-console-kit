<script setup>
  import c3 from 'c3'
  import { onMounted } from 'vue'
  import { FormatC3GraphProps } from '@modules/real-time-metrics/chart'
  import PrimeTag from 'primevue/tag'

  const props = defineProps({
    chartData: Object,
    resultChart: Array,
    hasMeanLineTotal: Boolean,
    hasMeanLineSeries: Boolean
  })

  onMounted(() => {
    generateGraph()
  })

  const generateC3Props = (resultChart) => {
    return FormatC3GraphProps({
      chartData: props.chartData,
      resultChart,
      hasMeanLineTotal: props.hasMeanLineTotal,
      hasMeanLineSeries: props.hasMeanLineSeries
    })
  }

  const generateGraph = () => {
    c3.generate({
      bindto: `#line-chart-${props.chartData?.id}`,
      ...generateC3Props(props.resultChart[0])
    })

    c3.generate({
      bindto: `#line-chart-${props.chartData?.id}-2`,
      ...generateC3Props(props.resultChart[1])
    })
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-4">
      <PrimeTag
        value="Status Code 200"
        severity="info"
        class="w-fit"
      />
      <div
        class="[&>svg]:w-auto [&>svg]:flex"
        :id="`line-chart-${props.chartData?.id}`"
      />
    </div>

    <div class="flex flex-col gap-4">
      <PrimeTag
        value="Status Code 300"
        severity="info"
        class="w-fit"
      />
      <div
        class="[&>svg]:w-auto [&>svg]:flex"
        :id="`line-chart-${props.chartData?.id}-2`"
      />
    </div>
  </div>
</template>
