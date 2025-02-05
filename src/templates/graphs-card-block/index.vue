<template>
  <div
    :class="[
      cardColumns,
      'flex flex-col rounded-md h-graph-card border surface-border col-span-12 p-6'
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
        :groupData="groupData"
      />
    </header>
    <div class="flex h-full flex-col gap-6 flex-auto">
      <div class="flex flex-col">
        <span class="break-words text-sm text-color-secondary font-normal line-height-1 py-3.5">
          {{ report.description }}
        </span>
        <AggregationInfo
          :report="report"
          v-if="chartStatus.showAggregation"
        />
        <InlineMessage
          v-else
          severity="error"
        >
          The chart can't be plotted. There was an issue loading the data.
        </InlineMessage>
      </div>
      <section class="flex-auto relative">
        <component
          v-if="chartStatus.showChart"
          :is="chartType[report.type]"
          :chartData="report"
          :variationValue="report.variationValue"
          :resultChart="report.resultQuery"
          :hasMeanLineTotal="report.showMeanLine"
          :hasMeanLineSeries="report.showMeanLinePerSeries"
        />
        <Skeleton
          v-else-if="chartStatus.showSkeleton"
          class="w-full h-full"
        />
        <p
          v-else-if="chartStatus.showNoData"
          class="text-color-secondary text-md h-full flex items-center justify-center"
        >
          No data available
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
  import InlineMessage from 'primevue/inlinemessage'
  import Skeleton from 'primevue/skeleton'
  import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
  import AggregationInfo from './components/aggregation-info.vue'
  import ChartOwner from './components/chart-owner.vue'
  import MoreOptionsMenu from './components/more-options-menu.vue'
  import { useLayout } from '@/composables/use-layout'
  defineOptions({ name: 'GraphsCardBlock' })

  const props = defineProps({
    clipboardWrite: Function,
    report: {
      type: Object,
      required: true
    },
    groupData: {
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
    list: defineAsyncComponent(() => import('./components/chart/list-chart')),
    gauge: defineAsyncComponent(() => import('./components/chart/gauge-chart')),
    'stacked-area': defineAsyncComponent(() => import('./components/chart/stacked-area-chart')),
    'stacked-bar': defineAsyncComponent(() => import('./components/chart/stacked-bar-chart'))
  }
  const { isSidebarActive } = useLayout()

  const shouldRenderChart = ref(true)

  const chartStatus = computed(() => {
    const { resultQuery, done, error } = props.report

    return {
      showChart: resultQuery?.length && done && shouldRenderChart.value,
      showSkeleton: !shouldRenderChart.value || (!error && !done),
      showAggregation: !error,
      showNoData: !resultQuery?.length && done
    }
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

  watch(isSidebarActive, () => {
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
