<script setup>
  import { useMetricsStore } from '@/stores/metrics'
  import GraphsCardBlock from '@/templates/graphs-card-block'
  import { storeToRefs } from 'pinia'
  import SelectButton from 'primevue/selectbutton'
  import { computed } from 'vue'

  defineProps({
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const metricsStore = useMetricsStore()
  const { dashboardBySelectedPage, dashboardCurrent, getCurrentReportsData } =
    storeToRefs(metricsStore)

  const { setCurrentDashboard, loadCurrentReports, setDatasetAvailableFilters } = metricsStore

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
          :report="report"
          :clipboardWrite="clipboardWrite"
        />
      </template>
    </div>
  </div>
</template>
