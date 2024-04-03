<script setup>
  import GraphsCardBlock from '@/templates/graphs-card-block'
  import SelectButton from 'primevue/selectbutton'
  import { computed } from 'vue'

  const props = defineProps({
    clipboardWrite: {
      type: Function,
      required: true
    },
    moduleActions: {
      type: Object,
      required: true
    },
    moduleGetters: {
      type: Object,
      required: true
    },
    groupData: {
      type: Object,
      required: true
    },
    reportData: {
      type: Object,
      required: true
    },
    userUTC: {
      type: String,
      required: true
    }
  })

  const { dashboardBySelectedPage, dashboardCurrent, getCurrentReportsData } = props.moduleGetters

  const { setCurrentDashboard, loadCurrentReports, setDatasetAvailableFilters } =
    props.moduleActions

  const dashboards = computed(() => {
    return dashboardBySelectedPage({ group: props.groupData })
  })

  const selectedDashboard = computed(() => {
    return dashboardCurrent({ group: props.groupData })
  })

  const reports = computed(() => {
    return getCurrentReportsData({ reports: props.reportData })
  })

  const changeDashboard = async (evt) => {
    setCurrentDashboard(evt.value)
    await setDatasetAvailableFilters()
    await loadCurrentReports(props.userUTC)
  }

  const showTabs = computed(() => {
    return dashboards.value?.length > 1
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
