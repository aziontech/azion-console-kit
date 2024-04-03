<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Metrics" />
    </template>
    <template
      #content
      v-if="showContent"
    >
      <TabsPageBlock
        :key="groupData.current?.id"
        :moduleActions="metricsModule.actions"
        :moduleGetters="metricsModule.getters"
        :groupData="groupData"
        :userUTC="userUTC"
      />
      <div class="card surface-border border rounded-md surface-section p-3.5 flex flex-col gap-4">
        <IntervalFilterBlock
          :key="filterData.current?.id"
          :moduleActions="metricsModule.actions"
          :moduleGetters="metricsModule.getters"
          :filterData="filterData"
          :userUTC="userUTC"
          @applyTSRange="load"
        />
        <ContentFilterBlock
          :key="filterData.current?.id"
          :playgroundOpener="playgroundOpener"
          :moduleActions="metricsModule.actions"
          :moduleGetters="metricsModule.getters"
          :filterData="filterData"
          :groupData="groupData"
          :userUTC="userUTC"
        />
      </div>
      <DashboardPanelBlock
        v-if="reportData"
        :key="groupData.currentDashboard?.id"
        :clipboardWrite="clipboardWrite"
        :moduleActions="metricsModule.actions"
        :moduleGetters="metricsModule.getters"
        :reportData="reportData"
        :groupData="groupData"
        :userUTC="userUTC"
      />
    </template>
  </ContentBlock>
</template>

<script setup>
  import { useAccountStore } from '@/stores/account'
  import RealTimeMetricsModule from '@/modules/real-time-metrics'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import ContentFilterBlock from './blocks/content-filter-block.vue'
  import DashboardPanelBlock from './blocks/dashboard-panel-block.vue'
  import IntervalFilterBlock from './blocks/interval-filter-block.vue'
  import TabsPageBlock from './blocks/tabs-page-block'

  defineProps({
    playgroundOpener: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  onMounted(() => {
    loadPageInfo()
  })

  const accountStore = useAccountStore()
  const userUTC = accountStore.accountUtcOffset

  const metricsModule = RealTimeMetricsModule()
  const {
    getters: { currentIdPageAndDashboard, getCurrentInfo },
    actions: {
      setInitialPageAndDashboardCurrent,
      setInfoAvailableFilters,
      setInitialCurrentsByIds,
      setDatasetAvailableFilters,
      loadCurrentReports
    },
    groupObservable,
    filterObservable,
    reportObservable
  } = metricsModule

  /* Module state */

  const groupData = ref(null)
  const filterData = ref(null)
  const reportData = ref(null)

  const updateGroupData = (data) => {
    groupData.value = { ...data }
  }
  groupObservable.subscribe(updateGroupData)

  const updateFilterData = (data) => {
    filterData.value = { ...data }
  }
  filterObservable.subscribe(updateFilterData)

  const updateReportData = (data) => {
    reportData.value = { ...data }
  }
  reportObservable.subscribe(updateReportData)

  /* ---- */

  const showContent = computed(() => {
    return groupData.value && filterData.value
  })

  const getCurrentIds = computed(() => {
    return currentIdPageAndDashboard({ group: groupData.value })
  })

  const loadPageInfo = async () => {
    setInitialPageAndDashboardCurrent()
    await setInfoAvailableFilters()
    setCurrentPageAndDashboard()
    await setDatasetAvailableFilters()
    updateRouter()
  }

  const load = async () => {
    await loadCurrentReports(userUTC)
  }

  const route = useRoute()

  const setCurrentPageAndDashboard = () => {
    const { pageId, dashboardId } = route.params

    if (!pageId || !dashboardId) return

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

  const currentInfo = computed(() => {
    if (!groupData.value) return
    return getCurrentInfo({ group: groupData.value })
  })

  watch(currentInfo, () => {
    updateRouter()
  })

  onUnmounted(() => {
    groupObservable.unsubscribe(updateGroupData)
    filterObservable.unsubscribe(updateFilterData)
    reportObservable.unsubscribe(updateReportData)
  })
</script>
