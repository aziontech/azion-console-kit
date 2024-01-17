<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Metrics" />
    </template>
    <template #content>
      <TabsPageBlock
        :metricsProductsService="fetchMetricsProductsService"
        :metricsGroupsService="fetchMetricsGroupsService"
        :params="routeParams"
      />
      <div class="card surface-border border rounded-md surface-section p-3.5 flex flex-col gap-4">
        <IntervalFilterBlock />
        <ContentFilterBlock :playgroundOpener="playgroundOpener" />
      </div>
      <DashboardPanelBlock
        :metricsDashboardsService="fetchMetricsDashboardsService"
        :params="routeParams"
      />
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import ContentFilterBlock from './blocks/content-filter-block.vue'
  import DashboardPanelBlock from './blocks/dashboard-panel-block.vue'
  import IntervalFilterBlock from './blocks/interval-filter-block.vue'
  import TabsPageBlock from './blocks/tabs-page-block'

  defineProps({
    fetchMetricsGroupsService: {
      type: Function,
      required: true
    },
    fetchMetricsProductsService: {
      type: Function,
      required: true
    },
    fetchMetricsDashboardsService: {
      type: Function,
      required: true
    },
    playgroundOpener: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const routeParams = ref({
    group: 'build',
    product: 'edge-applications'
  })

  watch(
    route,
    () => {
      const { group, product } = route.params

      if (group && product) {
        routeParams.value = { group, product }
      }
    },
    { immediate: true }
  )
</script>
