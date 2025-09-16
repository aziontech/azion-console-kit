<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Real-Time Metrics"
        data-testid="real-time-metrics__page-heading-block__title"
      />
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
      <div
        class="card surface-border border rounded-md surface-section p-3.5 flex flex-col gap-6 md:gap-4"
      >
        <!-- {{ groupData }} -->
        <!-- <IntervalFilterBlock
          :key="filterData.current?.id"
          :moduleActions="metricsModule.actions"
          :moduleGetters="metricsModule.getters"
          :filterData="filterData"
          :userUTC="userUTC"
          @applyTSRange="load"
          :groupData="groupData"
        /> -->
        <!-- <ContentFilterBlock
          :key="filterData.current?.id"
          :playgroundOpener="playgroundOpener"
          :moduleActions="metricsModule.actions"
          :moduleGetters="metricsModule.getters"
          :filterData="filterData"
          :groupData="groupData"
          :userUTC="userUTC"
          :filterHash="filterHash"
          @clearHash="clearFilterHash"
        /> -->
        <AdvancedFilterSystem
          v-model:filterData="filterData"
          :fieldsInFilter="filterFields"
          :filterDateRangeMaxDays="7"
          @updatedFilter="load"
        />
        <!-- @updatedFilter="reloadListTableWithHash" -->
      </div>
      <!-- -- {{ reportData }} -->
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
  import { computed, onMounted, onUnmounted, ref, watch, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import ContentFilterBlock from './blocks/content-filter-block.vue'
  import DashboardPanelBlock from './blocks/dashboard-panel-block.vue'
  import IntervalFilterBlock from './blocks/interval-filter-block.vue'
  import TabsPageBlock from './blocks/tabs-page-block'
  import AdvancedFilterSystem from '@/components/base/advanced-filter-system/index.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

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

  const route = useRoute()
  const filterHash = ref(null)
  const filterData = ref(null)
  const filterFields = ref([])

  const defaultFilter = {
    tsRange: {
      tsRangeBegin: new Date(new Date().setMinutes(new Date().getMinutes() - 5)),
      tsRangeEnd: new Date(),
      label: 'Last 5 minutes'
    },
    fields: [],
    dataset: ''
  }

  const setFilterHash = () => {
    filterHash.value = route?.query?.filters || ''
  }

  const clearFilterHash = () => {
    filterHash.value = ''
  }

  const accountStore = useAccountStore()
  const userUTC = accountStore.accountUtcOffset

  const metricsModule = RealTimeMetricsModule
  const {
    getters: { currentIdPageAndDashboard, getCurrentInfo },
    actions: {
      setInitialPageAndDashboardCurrent,
      setInfoAvailableFilters,
      setInitialCurrentsByIds,
      setDatasetAvailableFilters,
      loadCurrentReports,
      setTimeRange, // ADICIONE
      filterDatasetUpdate, // ADICIONE
      setFilters // ADICIONE
    },
    groupObservable,
    filterObservable,
    reportObservable
  } = metricsModule

  /* Module state */

  const groupData = ref(null)
  // const filterData = ref(null)
  const reportData = ref(null)

  onMounted(async () => {
    filterData.value = defaultFilter

    // setFilters({
    //   tsRange: {
    //     begin: new Date(defaultFilter.tsRange.tsRangeBegin).getTime(),
    //     end: new Date(defaultFilter.tsRange.tsRangeEnd).getTime(),
    //     meta: { label: defaultFilter.tsRange.label }
    //   },
    //   datasets: [], // sem campos inicialmente
    //   and: undefined
    // })

    await loadPageInfo()
    setFilterHash()
  })

  // const onUpdatedFilter = () => {
  //   filterFields.value = groupData.value.currentDashboard.datasetAvailable || []
  //   console.log('teste---- ', filterData.value)
  // }

  const updateGroupData = (data) => {
    groupData.value = { ...data }
  }
  groupObservable.subscribe(updateGroupData)

  const updateFilterData = (data) => {
    // console.log('data ', { ...data })
    // filterData.value = { ...data }
    console.log('aquiiiii *******')
    filterFields.value = data.datasetAvailable || []
    // reportData.value = { ...data }
  }
  filterObservable.subscribe(updateFilterData)

  const updateReportData = (data) => {
    reportData.value = { ...data }
  }
  reportObservable.subscribe(updateReportData)

  const showContent = computed(() => {
    return groupData.value && filterData.value
  })

  const getCurrentIds = computed(() => {
    return currentIdPageAndDashboard({ group: groupData.value })
  })

  const loadPageInfo = async () => {
    setCurrentPageAndDashboard()
    await setInfoAvailableFilters()
    await setDatasetAvailableFilters()
    updateRouter()
  }

  const load = async () => {
    console.log('___ filtro ', filterData.value.fields?.length)
    console.log('loader filter ', filterData.value)
    setTimeRange(defaultFilter.tsRange)
    await loadCurrentReports(userUTC)
  }

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

  const clickedToRealTimeMetrics = ({ eventName, payload }) => {
    tracker.realTimeMetrics
      .clickedToRealTimeMetrics({
        eventName,
        payload
      })
      .track()
  }

  const currentInfo = computed(() => {
    if (!groupData.value) return
    return getCurrentInfo({ group: groupData.value })
  })

  watch(currentInfo, () => {
    const eventName = 'Clicked to View Real-Time Metrics'
    const payload = {
      section: currentInfo.value.Group,
      page: currentInfo.value.Page
    }
    clickedToRealTimeMetrics({ eventName, payload })
    setTimeout(() => {
      updateRouter()
    }, 100)
  })

  onUnmounted(() => {
    groupObservable.unsubscribe(updateGroupData)
    filterObservable.unsubscribe(updateFilterData)
    reportObservable.unsubscribe(updateReportData)
  })
</script>
