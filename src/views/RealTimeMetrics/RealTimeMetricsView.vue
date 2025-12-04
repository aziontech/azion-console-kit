<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Real-Time Metrics"
        description="Gain insights with real-time metrics for operations."
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
        <!-- AdvancedFilterSystem - novo filtro unificado (tempo + campos), substitui IntervalFilterBlock/ContentFilterBlock -->
        <AdvancedFilterSystem
          v-model:filterData="advancedFilterModel"
          :fieldsInFilter="filterFields"
          :filterDateRangeMaxDays="7"
          :isLoadingFilters="isLoadingFilters"
          @updatedFilter="applyAdvancedFilter"
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
  import AdvancedFilterSystem from '@/components/base/advanced-filter-system/index.vue'
  import { useRoute, useRouter } from 'vue-router'
  import DashboardPanelBlock from './blocks/dashboard-panel-block.vue'
  import TabsPageBlock from './blocks/tabs-page-block'

  import { MAP_SERVICE_OPERATION } from '@modules/real-time-metrics/constants'
  import { GetRelevantField } from '@/modules/real-time-metrics/filters'
  import { FILTERS_RULES } from '@/helpers'

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

  const accountStore = useAccountStore()
  const userUTC = accountStore.accountUtcOffset

  const metricsModule = RealTimeMetricsModule
  const {
    getters: {
      currentIdPageAndDashboard,
      getCurrentInfo,
      getDatasetAvailableFilters,
      infoAvailableFiltersCurrent,
      dashboardCurrent
    },
    actions: {
      setInitialPageAndDashboardCurrent,
      setInfoAvailableFilters,
      setInitialCurrentsByIds,
      setDatasetAvailableFilters,
      loadCurrentReports,
      setTimeRange,
      filterDatasetUpdate,
      createAndFilter,
      resetFilters
    },
    groupObservable,
    filterObservable,
    reportObservable
  } = metricsModule

  /* Module state */

  const groupData = ref(null)
  const filterData = ref(null)
  const reportData = ref(null)

  // AdvancedFilterSystem - default alinhado com Real-Time Events (Last 5 minutes)
  const advancedFilterModel = ref({
    tsRange: {
      tsRangeBegin: new Date(new Date().setMinutes(new Date().getMinutes() - 5)),
      tsRangeEnd: new Date(),
      label: 'Last 5 minutes'
    },
    fields: [],
    dataset: ''
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

  const currentDashboard = computed(() => {
    if (!groupData.value) return null
    return dashboardCurrent({ group: groupData.value })
  })

  const isLoadingFilters = computed(() => {
    if (!filterFields.value.length) return true
    return false
  })

  const filterFields = computed(() => {
    if (!filterData.value || !currentDashboard.value) return []

    const infoOptions = infoAvailableFiltersCurrent({ filters: filterData.value })
    const options = getDatasetAvailableFilters({ filters: filterData.value })

    if (!options.length || !infoOptions) return []

    const { dataset } = currentDashboard.value

    const newOptions = options.map(({ label, operator, value }) => {
      const info = infoOptions[dataset][value]
      const mostRelevant = GetRelevantField(label, dataset)
      return {
        label,
        value,
        mostRelevant,
        description: info?.description,
        operator: operator.map((op) => ({
          value: op.value,
          type: op.type,
          props: {
            placeholder: info?.placeholder,
            services: MAP_SERVICE_OPERATION[`${value}${op.value}`] || []
          }
        }))
      }
    })

    FILTERS_RULES().sortFields(newOptions)
    return newOptions
  })

  const decodeFilter = (filters) => {
    if (!filters) return {}
    return JSON.parse(atob(filters))
  }

  // Time range: tenta ler do hash (query.filters); se não houver, cai no default (Last 5 minutes)
  const getTimeFilterInHash = () => {
    const { external } = decodeFilter(filterHash.value)
    return external
  }

  const setDefaultTimeRange = () => {
    const now = new Date()
    const endDate = new Date(now.getTime())
    const FIVE_MINUTES_IN_MS = 5 * 60 * 1000
    const beginDate = new Date(now.getTime() - FIVE_MINUTES_IN_MS)

    const begin = beginDate.toUTC(userUTC)
    const end = endDate.toUTC(userUTC)

    setTimeRange({
      tsRangeBegin: begin.resetUTC(userUTC).toBeholderFormat(),
      tsRangeEnd: end.resetUTC(userUTC).toBeholderFormat(),
      meta: { option: 'custom', label: 'Last 5 minutes' }
    })
  }

  const loadPageInfo = async () => {
    setCurrentPageAndDashboard()
    await setInfoAvailableFilters()
    await setDatasetAvailableFilters()
    updateRouter()

    const timeFilterFromHash = getTimeFilterInHash()

    if (timeFilterFromHash?.tsRange) {
      setTimeRange({
        tsRangeBegin: timeFilterFromHash.tsRange.begin,
        tsRangeEnd: timeFilterFromHash.tsRange.end,
        meta: { option: 'custom' }
      })
    } else {
      setDefaultTimeRange()
    }

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

  const syncAdvancedFilterModelWithModule = () => {
    if (!filterData.value || !filterData.value.selected) return

    const tsRange = filterData.value.selected.tsRange

    if (tsRange) {
      advancedFilterModel.value.tsRange = {
        tsRangeBegin: tsRange.begin,
        tsRangeEnd: tsRange.end,
        label: tsRange.meta?.label || ''
      }
    }
  }

  watch(filterData, () => {
    syncAdvancedFilterModelWithModule()
  })

  const applyAdvancedFilter = async () => {
    const { tsRange, fields } = advancedFilterModel.value

    if (tsRange?.tsRangeBegin && tsRange?.tsRangeEnd) {
      setTimeRange({
        tsRangeBegin: tsRange.tsRangeBegin,
        tsRangeEnd: tsRange.tsRangeEnd,
        meta: { option: 'custom', label: tsRange.label }
      })
    }

    resetFilters()

    fields?.forEach((item) => {
      const field = `${item.valueField}${item.operator}`
      const alias = `${item.operator}`

      if (item.operator === 'In') {
        filterDatasetUpdate({
          fieldName: field,
          fieldAlias: `${alias}`,
          in: item.value.map((domain) => ({
            sourceId: domain.value,
            sourceName: domain.label
          })),
          meta: {
            inputType: '[String]',
            fieldPrefix: `${alias}_`
          }
        })
        return
      }

      if (item.operator === 'Range') {
        createAndFilter({
          [field]: {
            begin: item.value.begin,
            end: item.value.end,
            meta: {
              inputType: item.type
            }
          }
        })
        return
      }

      if (item.type === 'StringObject') {
        createAndFilter({
          [field]: {
            value: item.value.value,
            meta: {
              inputType: 'String'
            }
          }
        })
        return
      }

      createAndFilter({
        [field]: {
          value: item.type !== 'Boolean' ? item.value : item.value.value,
          meta: {
            inputType: item.type
          }
        }
      })
    })

    await loadCurrentReports(userUTC)
  }

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
