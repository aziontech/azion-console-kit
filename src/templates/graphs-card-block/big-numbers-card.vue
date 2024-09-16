<template>
  <div
    :class="cardColumns"
    class="flex flex-col rounded-md border surface-border col-span-12 p-6"
  >
    <header class="flex w-full items-center justify-between gap-2">
      <span class="w-full gap-2 flex">
        <ChartOwner :chartOwner="report.chartOwner" />
        <span class="font-medium overflow-ellipsis break-all line-clamp-1">{{ report.label }}</span>
      </span>
      <MoreOptionsMenu
        :report="report"
        :clipboardWrite="clipboardWrite"
      />
    </header>
    <div class="flex h-full flex-col gap-6 flex-auto">
      <section class="flex-auto">
        <BigNumbersChart
          v-if="showChart"
          :chartData="report"
          :variationValue="report.variationValue"
          :resultChart="report.resultQuery"
        />
        <Skeleton
          v-if="showSkeleton"
          class="w-full h-12 mt-7"
        />
      </section>
    </div>
  </div>
</template>
<script setup>
  import Skeleton from 'primevue/skeleton'
  import { computed } from 'vue'
  import ChartOwner from './components/chart-owner.vue'
  import MoreOptionsMenu from './components/more-options-menu.vue'
  import BigNumbersChart from './components/chart/big-numbers-chart.vue'
  defineOptions({ name: 'GraphsCardBlock' })

  const props = defineProps({
    clipboardWrite: Function,
    report: {
      type: Object,
      required: true
    }
  })

  const cardColumns = computed(() => {
    const defaultColumns = 'lg:col-span-6'
    const columns = {
      3: 'lg:col-span-3',
      4: 'lg:col-span-4',
      8: 'lg:col-span-8',
      12: 'lg:col-span-12'
    }

    return columns[props.report.columns] || defaultColumns
  })

  const showChart = computed(() => {
    return props.report.resultQuery?.length
  })

  const showAggregation = computed(() => {
    return !props.report.error
  })

  const showSkeleton = computed(() => {
    return !showChart.value && showAggregation.value
  })
</script>
