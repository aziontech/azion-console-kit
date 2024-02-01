<script setup>
  import { useMetricsStore } from '@/stores/metrics'
  import GraphsCardBlock from '@/templates/graphs-card-block'
  import { storeToRefs } from 'pinia'
  import SelectButton from 'primevue/selectbutton'
  import Skeleton from 'primevue/skeleton'
  import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref } from 'vue'

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

  const showChart = ref(true)

  const reRenderChart = () => {
    showChart.value = false
    nextTick(() => {
      showChart.value = true
    })
  }

  onMounted(() => {
    window.addEventListener('resize', reRenderChart)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', reRenderChart)
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
          chartOwner="azion"
          :title="report.label"
          :description="report.description"
          :cols="report.columns"
          :aggregationType="report.aggregationType"
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
