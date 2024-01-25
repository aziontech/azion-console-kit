<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Metrics" />
    </template>
    <template #content>
      <TabsPageBlock />
      <div class="card surface-border border rounded-md surface-section p-3.5 flex flex-col gap-4">
        <IntervalFilterBlock />
        <ContentFilterBlock :playgroundOpener="playgroundOpener" />
      </div>
      <DashboardPanelBlock />
    </template>
  </ContentBlock>
</template>

<script setup>
  import { useMetricsStore } from '@/stores/metrics'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { onMounted } from 'vue'
  import ContentFilterBlock from './blocks/content-filter-block.vue'
  import DashboardPanelBlock from './blocks/dashboard-panel-block.vue'
  import IntervalFilterBlock from './blocks/interval-filter-block.vue'
  import TabsPageBlock from './blocks/tabs-page-block'

  defineProps({
    playgroundOpener: {
      type: Function,
      required: true
    }
  })

  onMounted(() => {
    loadPageInfo()
  })

  const metricsStore = useMetricsStore()
  const loadPageInfo = async () => {
    await metricsStore.setInfoAvailableFilters()
  }
</script>
