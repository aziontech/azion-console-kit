<script setup>
  import { useMetricsStore } from '@/stores/metrics'
  import GraphsCardBlock from '@/templates/graphs-card-block'
  import { storeToRefs } from 'pinia'
  import SelectButton from 'primevue/selectbutton'
  import { computed } from 'vue'

  const metricsStore = useMetricsStore()
  const { dashboardBySelectedPage, dashboardCurrent } = storeToRefs(metricsStore)
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
    <div class="grid grid-cols-12 gap-4 m-0">
      <template
        v-for="i of 6"
        :key="i"
      >
        <GraphsCardBlock
          chartOwner="azion"
          title="Four Columns Card"
          description="This card is 4 columns wide, sets the aggregation type to 'Average', the variation type to 'positive', and the variation value to '10.2%'."
          :cols="4"
          aggregationType="Average"
          variationType="positive"
          variationValue="10.2%"
        >
          <template #chart>
            <div class="surface-border border border-dashed flex items-center h-full">
              <p class="text-color-secondary text-center w-full">Slot</p>
            </div>
          </template>
        </GraphsCardBlock>
      </template>
    </div>
  </div>
</template>
