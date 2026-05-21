<script setup>
  /**
   * DashboardPanel — a predefined investigation panel (Security, Performance, Edge Functions).
   *
   * Thin wrapper around TabPanelBlock. The panel provides:
   *  - A fixed dataset (no dataset selector)
   *  - Pre-selected fields relevant to the investigation context
   *  - A list of Metrics dashboards the user can browse via a dropdown
   *
   * Everything else — histogram, brush-select drill-down, fields sidebar, table,
   * keyboard navigation, export, saved searches — comes from TabPanelBlock unchanged.
   */
  import { computed } from 'vue'
  import TabPanelBlock from '@/views/RealTimeEvents/Blocks/tab-panel-block.vue'
  import TABS_EVENTS from '@/views/RealTimeEvents/Blocks/constants/tabs-events'
  import { useMetricsDashboardResolver } from '@/views/RealTimeEvents/composables/useMetricsDashboardResolver'

  defineOptions({ name: 'DashboardPanel' })

  const props = defineProps({
    panelConfig: {
      type: Object,
      required: true
    },
    listEventsService: {
      type: Function,
      required: true
    },
    filterFields: {
      type: Array,
      default: () => []
    },
    loadEventsChartAggregation: {
      type: Function,
      default: null
    }
  })

  const emit = defineEmits(['dataset-change'])

  // Resolve the TABS_EVENTS entry that matches the panel's dataset
  const tabSelected = computed(() => {
    const dataset = props.panelConfig?.eventsConfig?.dataset
    if (!dataset) return null
    return Object.values(TABS_EVENTS).find((tab) => tab.dataset === dataset) || null
  })

  const initialFilters = computed(() => {
    return props.panelConfig?.eventsConfig?.defaultFilters || []
  })

  // Resolve metrics dashboard options from panel config IDs
  const { metricsDashboardOptions } = useMetricsDashboardResolver(
    computed(() => props.panelConfig?.metricsDashboardIds || [])
  )
</script>

<template>
  <TabPanelBlock
    v-if="tabSelected"
    :listService="listEventsService"
    :filterFields="filterFields"
    :tabSelected="tabSelected"
    :loadEventsChartAggregation="loadEventsChartAggregation"
    :initialFilters="initialFilters"
    :hideDatasetSelector="true"
    :metricsDashboards="metricsDashboardOptions"
    @dataset-change="(ds) => emit('dataset-change', ds)"
  />
</template>
