<template>
  <div
    :class="[
      cardColumns,
      'flex flex-col rounded-md h-graph-card border surface-border col-span-12 p-6 relative'
    ]"
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
      <div class="flex flex-col">
        <span class="break-words text-sm text-color-secondary font-normal line-height-1 py-3.5">
          {{ report.description }}
        </span>
        <AggregationInfo
          :report="report"
          v-if="showAggregation"
        />
        <InlineMessage
          v-else
          severity="error"
        >
          The chart can't be plotted. There was an issue loading the data.
        </InlineMessage>
      </div>
      <section class="flex-auto">
        <component
          v-if="showChart"
          :is="chartType[report.type]"
          :chartData="report"
          :variationValue="report.variationValue"
          :resultChart="report.resultQuery"
          :hasMeanLineTotal="report.showMeanLine"
          :hasMeanLineSeries="report.showMeanLinePerSeries"
        />
        <Skeleton
          v-if="showSkeleton"
          class="w-full h-full"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
  import { useHelpCenterStore } from '@/stores/help-center'
  import { storeToRefs } from 'pinia'
  import InlineMessage from 'primevue/inlinemessage'
  import Skeleton from 'primevue/skeleton'
  import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
  import AggregationInfo from './components/aggregation-info.vue'
  import ChartOwner from './components/chart-owner.vue'
  import MoreOptionsMenu from './components/more-options-menu.vue'

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
      4: 'lg:col-span-4',
      8: 'lg:col-span-8',
      12: 'lg:col-span-12'
    }

    return columns[props.report.columns] || defaultColumns
  })

  const chartType = {
    bar: defineAsyncComponent(() => import('./components/chart/bar-chart')),
    line: defineAsyncComponent(() => import('./components/chart/line-chart')),
    spline: defineAsyncComponent(() => import('./components/chart/spline-chart')),
    pie: defineAsyncComponent(() => import('./components/chart/pie-chart')),
    donut: defineAsyncComponent(() => import('./components/chart/donut-chart')),
    'ordered-bar': defineAsyncComponent(() => import('./components/chart/ordered-bar-chart')),
    map: defineAsyncComponent(() => import('./components/map/map-chart')),
    'big-numbers': defineAsyncComponent(() => import('./components/chart/big-numbers-chart')),
    gauge: defineAsyncComponent(() => import('./components/chart/gauge-chart'))
  }

  const { getStatus } = storeToRefs(useHelpCenterStore())

  const shouldRenderChart = ref(true)

  const showChart = computed(() => {
    return props.report.resultQuery?.length && shouldRenderChart.value
  })

  const showAggregation = computed(() => {
    return !props.report.error
  })

  const showSkeleton = computed(() => {
    return !showChart.value && showAggregation.value
  })

  const reRenderChart = () => {
    /*
     * This approach was used to re-render the chart after 3 main changes:
     * window resize, mean line and helpcenter toggling
     * The nextTick was not sufficient to resolve the latter.
     * HelpCenter takes 300ms to animate. To garantee the proper re-render, 350ms was used.
     */
    const timeout = 350

    shouldRenderChart.value = false
    setTimeout(() => {
      shouldRenderChart.value = true
    }, timeout)
  }

  onMounted(() => {
    window.addEventListener('resize', reRenderChart)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', reRenderChart)
  })

  watch(getStatus, () => {
    reRenderChart()
  })

  watch(
    () => props.report,
    () => {
      reRenderChart()
    },
    { deep: true }
  )
</script>
