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
      <!-- Sistema de Filtros Avançados -->
      <div class="mb-6">
        <AdvancedFilterSystem
          v-model="advancedFilterState"
          @search="handleAdvancedSearch"
          @dateChange="handleAdvancedDateChange"
          @filterChange="handleAdvancedFilterChange"
          @update="handleAdvancedUpdate"
        />
      </div>

      <div
        class="card surface-border border rounded-md surface-section p-3.5 flex flex-col gap-6 md:gap-4"
      >
        <IntervalFilterBlock
          :key="filterData.current?.id"
          :moduleActions="metricsModule.actions"
          :moduleGetters="metricsModule.getters"
          :filterData="filterData"
          :userUTC="userUTC"
          @applyTSRange="load"
          :groupData="groupData"
        />
        <ContentFilterBlock
          :key="filterData.current?.id"
          :playgroundOpener="playgroundOpener"
          :moduleActions="metricsModule.actions"
          :moduleGetters="metricsModule.getters"
          :filterData="filterData"
          :groupData="groupData"
          :userUTC="userUTC"
          :filterHash="filterHash"
          @clearHash="clearFilterHash"
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
  import { computed, onMounted, onUnmounted, ref, watch, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import ContentFilterBlock from './blocks/content-filter-block.vue'
  import DashboardPanelBlock from './blocks/dashboard-panel-block.vue'
  import IntervalFilterBlock from './blocks/interval-filter-block.vue'
  import TabsPageBlock from './blocks/tabs-page-block'
  import AdvancedFilterSystem from '@/templates/advanced-filter-system/index.vue'

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

  onMounted(() => {
    loadPageInfo()
    setFilterHash()
  })

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

  /* Advanced Filter System state */
  const advancedFilterState = ref({
    searchQuery: '',
    dateRange: {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 horas atrás
      endDate: new Date()
    },
    filters: []
  })

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
    await loadCurrentReports(userUTC)
  }

  /* Advanced Filter System methods */
  const handleAdvancedSearch = (query) => {
    console.log('Advanced search query:', query)
    // Aqui você pode integrar com o sistema de filtros existente
    // Por exemplo, aplicar a busca nos filtros do módulo de métricas
  }

  const handleAdvancedDateChange = (range) => {
    console.log('Advanced date range changed:', range)
    // Aqui você pode integrar com o sistema de datas existente
    // Por exemplo, aplicar o range de datas nos filtros do módulo
  }

  const handleAdvancedFilterChange = (filters) => {
    console.log('Advanced filters changed:', filters)
    // Aqui você pode integrar com o sistema de filtros existente
    // Por exemplo, converter os filtros avançados para o formato do módulo
  }

  const handleAdvancedUpdate = (state) => {
    console.log('Advanced filter state updated:', state)
    // Aqui você pode aplicar todas as mudanças do sistema avançado
    // Por exemplo, recarregar os relatórios com os novos filtros
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

  // Watcher para sincronizar filtros avançados com o sistema existente
  watch(
    advancedFilterState,
    (newState) => {
      console.log('Advanced filter state changed:', newState)
      // Aqui você pode implementar a lógica de sincronização
      // Por exemplo, converter os filtros avançados para o formato do módulo
      // e aplicar nos filtros existentes
    },
    { deep: true }
  )

  onUnmounted(() => {
    groupObservable.unsubscribe(updateGroupData)
    filterObservable.unsubscribe(updateFilterData)
    reportObservable.unsubscribe(updateReportData)
  })
</script>
