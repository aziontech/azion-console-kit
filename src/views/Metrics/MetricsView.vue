<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Metrics" />
    </template>
    <template #content>
      <TabsPageBlock />
      <div class="card surface-border border rounded-md surface-section p-3.5 flex flex-col gap-4">
        <IntervalFilterBlock @applyTSRange="load" />
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
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
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
  const {
    setInfoAvailableFilters,
    setGroupPage,
    setInitialPageAndDashboardCurrent,
    setInitialCurrentsByIds,
    setDatasetAvailableFilters,
    setReports,
    loadCurrentReports
  } = metricsStore

  const { currentIdPageAndDashboard, getCurrentInfo } = storeToRefs(metricsStore)

  const getCurrentIds = computed(() => {
    return currentIdPageAndDashboard.value
  })

  const loadPageInfo = async () => {
    await setInfoAvailableFilters()
    await setGroupPage()
    setCurrentPageAndDashboard()
    await setDatasetAvailableFilters()
    await setReports()
    updateRouter()
  }

  const load = async () => {
    await loadCurrentReports()
  }

  const route = useRoute()

  const setCurrentPageAndDashboard = () => {
    const { pageId, dashboardId } = route.params

    if (!pageId || !dashboardId) {
      return setInitialPageAndDashboardCurrent()
    }

    return setInitialCurrentsByIds({ pageId, dashboardId })
  }

  const router = useRouter()

  const updateRouter = () => {
    const { query } = route

    router.push({
      name: 'real-time-metrics',
      params: getCurrentIds.value,
      query
    })
  }

  watch(getCurrentInfo, () => {
    updateRouter()
  })
</script>
