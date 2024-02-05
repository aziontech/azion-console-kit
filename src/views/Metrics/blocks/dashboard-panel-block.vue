<script setup>
  import { useHelpCenterStore } from '@/stores/help-center'
  import { useMetricsStore } from '@/stores/metrics'
  import GraphsCardBlock from '@/templates/graphs-card-block'
  import { storeToRefs } from 'pinia'
  import SelectButton from 'primevue/selectbutton'
  import Skeleton from 'primevue/skeleton'
  import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'

  const propToComponent = {
    'bar-chart': defineAsyncComponent(() => import('../components/chart/bar-chart/bar-chart')),
    'line-chart': defineAsyncComponent(() => import('../components/chart/line-chart/line-chart')),
    'spline-chart': defineAsyncComponent(() =>
      import('../components/chart/spline-chart/spline-chart')
    )
  }

  const metricsStore = useMetricsStore()
  const { dashboardBySelectedPage, dashboardCurrent, getCurrentReportsData } =
    storeToRefs(metricsStore)
  const { setCurrentDashboard, loadCurrentReports, setDatasetAvailableFilters } = metricsStore

  const { getStatus } = storeToRefs(useHelpCenterStore())

  const showChart = ref(true)

  const reRenderChart = () => {
    /*
     * This approach was used to re-render the chart after screen resize and help center toggling.
     * The nextTick was not sufficient to resolve the latter.
     * HelpCenter takes 300ms to animate. To garantee the proper re-render, 350ms was used.
     */
    const timeout = 350

    showChart.value = false
    setTimeout(() => {
      showChart.value = true
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

  const dashboards = computed(() => {
    return dashboardBySelectedPage.value
  })

  const selectedDashboard = computed(() => {
    return dashboardCurrent.value
  })

  const changeDashboard = async (evt) => {
    setCurrentDashboard(evt.value)
    await setDatasetAvailableFilters()
    await loadCurrentReports()
  }

  const showTabs = computed(() => {
    return dashboards.value?.length > 1
  })

  const reports = computed(() => {
    return getCurrentReportsData.value
  })

  const hasMeanLine = (resultQuery = []) => {
    return resultQuery.length > 1
  }

  const hasMeanLinePerSeries = (resultQuery = []) => {
    return resultQuery.length > 2
  }
</script>

<template>
  <div class="flex flex-column mt-8 gap-4">
    <SelectButton
      class="w-fit"
      :modelValue="selectedDashboard"
      :options="dashboards"
      optionLabel="label"
      aria-labelledby="basic"
      @change="changeDashboard"
      v-if="showTabs"
    />
    <div
      class="grid grid-cols-12 gap-4 m-0"
      v-if="reports?.length"
    >
      <template
        v-for="report of reports"
        :key="report.id"
      >
        <GraphsCardBlock
          :reportId="`${report.id}`"
          chartOwner="azion"
          :title="report.label"
          :description="report.description"
          :cols="report.columns"
          :aggregationType="report.aggregationType"
          :hasMeanLine="hasMeanLine(report.resultQuery)"
          :hasMeanLinePerSeries="hasMeanLinePerSeries(report.resultQuery)"
          variationType="positive"
          variationValue="10.2%"
        >
          <template #chart>
            <component
              v-if="report.resultQuery?.length && showChart"
              :is="propToComponent[`${report.type}-chart`]"
              :chartData="report"
              :resultChart="report.resultQuery"
            />
            <Skeleton
              v-else
              class="w-full h-full"
            />
          </template>
        </GraphsCardBlock>
      </template>
    </div>
  </div>
</template>
