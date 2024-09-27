<script setup>
  import GraphsCardBlock from '@/templates/graphs-card-block'
  import BigNumbers from '@/templates/graphs-card-block/big-numbers-card.vue'
  import SelectButton from 'primevue/selectbutton'
  import Skeleton from 'primevue/skeleton'
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
    const reports = getCurrentReportsData({ reports: props.reportData })
    const listGeneralReports = []
    const listBigNumbersReports = []
    for (const report of reports) {
      if (report.type !== 'big-numbers') {
        listGeneralReports.push(report)
      } else {
        listBigNumbersReports.push(report)
      }
    }

    return {
      generalReports: listGeneralReports,
      bigNumberReports: listBigNumbersReports
    }
  })

  const showReportCharts = computed(
    () => reports.value.generalReports.length || reports.value.bigNumberReports.length
  )

  const changeDashboard = async (evt) => {
    if (!evt.value) return
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
      class="w-full whitespace-nowrap overflow-x-auto"
      :modelValue="selectedDashboard"
      :options="dashboards"
      optionLabel="label"
      aria-labelledby="basic"
      @change="changeDashboard"
      v-if="showTabs"
    />
    <div
      class="grid grid-cols-12 gap-4 m-0"
      v-if="showReportCharts"
    >
      <div
        class="col-span-12"
        v-if="reports.bigNumberReports.length"
      >
        <div class="grid grid-cols-12 gap-4 m-0">
          <template
            v-for="bigNumberReport of reports.bigNumberReports"
            :key="bigNumberReport.id"
          >
            <BigNumbers
              :report="bigNumberReport"
              :clipboardWrite="clipboardWrite"
            />
          </template>
        </div>
      </div>

      <template
        v-for="report of reports.generalReports"
        :key="report.id"
      >
        <GraphsCardBlock
          :report="report"
          :groupData="groupData"
          :clipboardWrite="clipboardWrite"
        />
      </template>
    </div>
    <div
      class="grid grid-cols-12 gap-4 m-0"
      v-else
    >
      <template
        v-for="item of 4"
        :key="item"
      >
        <div
          class="flex flex-col rounded-md h-graph-card border surface-border lg:col-span-6 col-span-12 p-6"
        >
          <header class="flex w-full items-center justify-between gap-2">
            <Skeleton class="h-6 w-64" />
            <Skeleton class="h-8 w-8" />
          </header>
          <div class="flex h-full flex-col gap-6 flex-auto">
            <div class="flex flex-col pt-3.5 gap-3.5">
              <Skeleton class="h-6 w-96" />
              <Skeleton class="h-6 w-8" />
            </div>
            <div class="flex-auto">
              <Skeleton class="w-full h-full" />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
