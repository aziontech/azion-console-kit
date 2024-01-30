<script setup>
  import { useMetricsStore } from '@/stores/metrics'
  import GraphsCardBlock from '@/templates/graphs-card-block'
  import { storeToRefs } from 'pinia'
  import SelectButton from 'primevue/selectbutton'
  import { computed, defineAsyncComponent } from 'vue'

  const BarChart = defineAsyncComponent(() => import('../components/chart/bar-chart/bar-chart'))
  const LineChart = defineAsyncComponent(() => import('../components/chart/line-chart/line-chart'))
  const SplineChart = defineAsyncComponent(() =>
    import('../components/chart/spline-chart/spline-chart')
  )

  const propToComponent = {
    'bar-chart': BarChart,
    'line-chart': LineChart,
    'spline-chart': SplineChart
  }

  const props = defineProps({
    reportData: {
      type: Object,
      default: () => {}
    }
  })

  const metricsStore = useMetricsStore()
  const { dashboardBySelectedPage, dashboardCurrent, reportsBySelectedDashboard } =
    storeToRefs(metricsStore)
  const { setCurrentDashboard } = metricsStore

  const dashboards = computed(() => {
    return dashboardBySelectedPage.value
  })

  const selectedDashboard = computed(() => {
    return dashboardCurrent.value
  })

  const changeDashboard = (evt) => {
    setCurrentDashboard(evt.value)
  }

  const showTabs = computed(() => {
    return dashboards.value?.length > 1
  })

  const reportsData = computed(() => {
    return reportsBySelectedDashboard.value
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
      v-if="reportsData?.length"
    >
      <template
        v-for="report of reportsData"
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
            <component :is="propToComponent[`${props.reportData?.type}-chart`]" />
          </template>
        </GraphsCardBlock>
      </template>
    </div>
  </div>
</template>
