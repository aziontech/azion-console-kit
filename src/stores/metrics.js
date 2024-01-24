import DATE_TIME_INTERVALS from '@views/Metrics/constants/date-time-interval'
import { defineStore } from 'pinia'
import {
  LoadDatasetAvailableAggregations,
  LoadDatasetAvailableFilters,
  LoadFilters,
  LoadInfoAvailableFilters,
  LoadPagesDashboards,
  LoadReports,
  LoadReportsDataBySelectedDashboard
} from './metrics-store/actions'

export const useMetricsStore = defineStore('metrics', {
  state: () => ({
    listGroupPage: [], // All pages with their dashboards
    currentGroupPage: {}, // Actual page selected
    currentPage: {}, // Actual page selected
    currentDashboard: {}, // Selected dashboard
    reports: [], // List of all reports
    selectFilter: {},
    isLoadingFilters: false,
    dateTimeFilterOptions: [...DATE_TIME_INTERVALS],
    filters: {},
    currentReportsData: [], // Selected reports with Meta and Data values
    datasetAvailableFilters: [], // Filter fields by dataset
    infoAvailableFilters: [], // Filter fields by dataset
    datasetFilterFields: [],
    datasetAvailableAggregations: [] // All available aggregation by dataset
  }),
  getters: {
    dateTimeFilterOptions: (state) => state.dateTimeFilterOptions,
    isLoadingFilters: (state) => state.isLoadingFilters,
    getKeysToFilters: (state) => [
      ...(state.filters.and
        ? Object.keys(state.filters.and).filter((item) => item !== 'meta')
        : []),
      ...(state.filters.datasets
        ? state.filters.datasets.map((dataset) => `${dataset.fieldAlias}In`)
        : [])
    ],
    getDatasetAvailableUnused: (state) => {
      const keysToRemove = this.getKeysToFilters
      if (keysToRemove) {
        return state.datasetAvailableFilters.filter((field) => !keysToRemove.includes(field.label))
      }
      return state.datasetAvailableFilters
    },
    getFilterSelect: (state) => state.selectFilter,
    getGroupPages: (state) => state.listGroupPage,
    getCurrentInfo: (state) => ({
      Page: state.currentPage.label,
      Dashboard: state.currentDashboard.label,
      Group: state.currentGroupPage.label
    }),
    pages: (state) =>
      state.currentGroupPage.pagesDashboards?.map((item, idx) => ({
        idx: idx,
        id: item.id,
        label: item.label
      })),
    pageCurrent: (state) => state.currentPage,
    groupPageCurrent: (state) => state.currentGroupPage,
    datasetAvailableFiltersCurrent: (state) => state.datasetAvailableFilters,
    infoAvailableFiltersCurrent: (state) => state.infoAvailableFilters,
    dashboardCurrent: (state) => state.currentDashboard,
    dashboardBySelectedPage: (state) => {
      if (!state.currentGroupPage.pagesDashboards) {
        return []
      }

      const page = state.currentGroupPage.pagesDashboards.filter(
        (currentPage) => currentPage.id === state.currentPage.id
      )
      const dashboards = page?.[0]?.dashboards || []
      return dashboards
    },
    reportsBySelectedDashboard: (state) => {
      const reports = state.reports.filter((report) => {
        const dashboardId = state.currentDashboard?.id?.toString()
        return report.dashboardId.toString() === dashboardId
      })
      return reports
    },
    currentIdPageAndDashboard: (state) => {
      const currentIds = {
        pageId: state.currentPage.url,
        dashboardId: state.currentDashboard.url
      }
      return currentIds
    },
    currentLabelPageAndDashboard: (state) => {
      const currentIds = {
        currentPage: state.currentPage.label,
        currentDashboard: state.currentDashboard.label
      }
      return currentIds
    },
    currentReportsData: (state) => state.currentReportsData,
    currentFilters: (state) => state.filters,
    currentSelectedFilters: (state) => {
      const filters = {}
      if (state.filters.datasets) filters.datasets = state.filters.datasets
      if (state.filters.and) {
        filters.and = {}
        for (const andFilter in state.filters.and) {
          if (andFilter === 'meta') continue
          filters.and[andFilter] = state.filters.and[andFilter]
        }
      }
      return filters
    },
    currentCounterFilter: (state) => {
      const andKeys = state.filters?.and || {}
      const filteredAnd = Object.keys(andKeys).filter((filter) => filter !== 'meta')
      const counterAnd = filteredAnd.length
      const countDatasets = state.filters.datasets?.length || 0
      return counterAnd + countDatasets
    },
    datasetFilterByName: (state) => (datasetFieldName) => {
      const filters = state.filters.datasets?.find((field) => field.fieldName === datasetFieldName)
      return filters?.in || []
    },
    getValueFilterAndByName: (state) => (fieldName) => {
      const valueElement = state.filters?.and?.[fieldName]?.value
      return valueElement
    },
    getFlatSelectedFilters: (state) => {
      const currentFilters = state.filters
      const andFiltersKey = Object.keys(currentFilters?.and || {})
      const datasetKey = currentFilters?.datasets?.map((dataset) => dataset.fieldAlias) || []

      const filtersSelectedName = [].concat(andFiltersKey, datasetKey)
      return filtersSelectedName
    }
  },
  actions: {
    async setDatasetAvailableAggregations(dataset) {
      const aggregationList = await LoadDatasetAvailableAggregations(dataset)
      this.datasetAvailableAggregations = aggregationList
    },
    async setDatasetAvailableFilters() {
      const availableFilters = await LoadDatasetAvailableFilters(this.currentDashboard.dataset)
      this.datasetAvailableFilters = availableFilters
    },
    setFilters(filters) {
      this.filters = filters
    },
    resetFilters() {
      const tsRange = this.filters.tsRange
      this.setFilters({ tsRange })
    },
    async setDecodedFilters(filters) {
      const decodedFilter = await LoadFilters(this.datasetAvailableFilters, filters)
      this.setFilters(decodedFilter)
    },
    async setInfoAvailableFilters() {
      const availableFilters = await LoadInfoAvailableFilters()
      this.infoAvailableFilters = availableFilters
    },
    async setPagesDashboards() {
      const pagesDashboards = await LoadPagesDashboards()
      this.listGroupPage = pagesDashboards
    },
    async setReports() {
      const reports = await LoadReports()
      this.reports = reports
    },
    async loadCurrentReports() {
      await LoadReportsDataBySelectedDashboard(this.filters, this.reports)
    },
    setCurrentReports(availableReports) {
      this.currentReportsData = availableReports
    },
    async setCurrentReportValue({ reportId, reportData, reportQuery, error }) {
      const reportIdx = this.currentReportsData.findIndex(
        (reportItem) => reportItem.id === reportId
      )
      if (reportIdx < 0) return
      this.currentReportsData[reportIdx].resultQuery = reportData
      this.currentReportsData[reportIdx].reportQuery = reportQuery
      this.currentReportsData[reportIdx].error = error
    }
  }
})
