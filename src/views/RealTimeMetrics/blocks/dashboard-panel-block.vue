<script setup>
  import GraphsCardBlock from '@/templates/graphs-card-block'
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
