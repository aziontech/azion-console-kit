import {
  GROUP_DASHBOARDS,
  REPORTS,
  DATE_TIME_INTERVALS
} from '@modules/real-time-metrics/constants'

import { defineStore } from 'pinia'
import {
  LoadDatasetAvailableFilters,
  LoadInfoAvailableFilters,
  LoadReportsDataBySelectedDashboard
} from '@/modules/real-time-metrics/actions'

export const useMetricsStore = defineStore('metrics', {
  state: () => ({
    listGroupPage: [...GROUP_DASHBOARDS], // All pages with their dashboards
    reports: [...REPORTS], // List of all reports
    dateTimeFilterOptions: [...DATE_TIME_INTERVALS],
    currentGroupPage: {}, // Actual page selected
    currentPage: {}, // Actual page selected
    currentDashboard: {}, // Selected dashboard
    isLoadingFilters: false,
    filters: {},
    currentReportsData: [], // Selected reports with Meta and Data values
    datasetAvailableFilters: [], // Filter fields by dataset
    infoAvailableFilters: [] // Filter fields by dataset
  }),
  getters: {
    getDateTimeFilterOptions: (state) => state.dateTimeFilterOptions,
    getIsLoadingFilters: (state) => {
      return (
        !state.datasetAvailableFilters.length || !Object.keys(state.infoAvailableFilters).length
      )
    },
    getFilterSelect: (state) => state.selectFilter,
    getGroupPages: (state) => state.listGroupPage,
    getCurrentInfo: (state) => ({
      Page: state.currentPage.label,
      Dashboard: state.currentDashboard.label,
      Group: state.currentGroupPage.label
    }),
    getPages: (state) =>
      state.currentGroupPage?.pagesDashboards?.map((item, idx) => ({
        idx: idx,
        id: item.id,
        label: item.label,
        path: item.path,
        dashboards: item.dashboards
      })),
    pageCurrent: (state) => state.currentPage,
    groupPageCurrent: (state) => state.currentGroupPage,
    infoAvailableFiltersCurrent: (state) => state.infoAvailableFilters,
    dashboardCurrent: (state) => state.currentDashboard,
    dashboardBySelectedPage: (state) => {
      if (!state.currentGroupPage?.pagesDashboards) {
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
        const dashboardId = state.currentDashboard?.id
        return report.dashboardId === dashboardId
      })
      return reports
    },
    currentIdPageAndDashboard: (state) => {
      const currentIds = {
        pageId: state.currentPage.path,
        dashboardId: state.currentDashboard.path
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
    getCurrentReportsData: (state) => state.currentReportsData,
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
    getDatasetAvailableFilters: (state) => {
      return state.datasetAvailableFilters
    },
    getCurrentReportsDataById: (state) => {
      return (id) => state.currentReportsData.find((report) => report.id === id)
    }
  },
  actions: {
    setFilterSelect(filter) {
      this.selectFilter = filter
    },
    async setDatasetAvailableFilters() {
      const availableFilters = await LoadDatasetAvailableFilters(this.currentDashboard.dataset)
      this.datasetAvailableFilters = availableFilters
    },
    async setInfoAvailableFilters() {
      const availableFilters = await LoadInfoAvailableFilters()
      this.infoAvailableFilters = availableFilters
    },
    setCurrentGroupPage(groupPage) {
      this.currentGroupPage = groupPage
    },
    setCurrentPage(page) {
      this.currentPage = page
      ;[this.currentDashboard] = this.currentPage.dashboards
      this.currentDashboard.active = true
    },
    setCurrentDashboard(dashboard) {
      this.currentDashboard = dashboard
    },
    setInitialPageAndDashboardCurrent() {
      if (this.listGroupPage.length) {
        ;[this.currentGroupPage] = this.listGroupPage
        ;[this.currentPage] = this.currentGroupPage.pagesDashboards
        ;[this.currentDashboard] = this.currentPage.dashboards
        this.currentDashboard.active = true
      }
    },
    setInitialCurrentsByIds({ pageId, dashboardId }) {
      if (!this.listGroupPage.length) {
        return
      }

      this.currentGroupPage = this.listGroupPage.find((groupPage) => {
        this.currentPage = groupPage.pagesDashboards.find(({ path }) => `${path}` === pageId)
        return this.currentPage
      })

      const newListDashboards = this.currentPage.dashboards.map((dashboard) => {
        const updateDashboard = {
          ...dashboard,
          active: `${dashboard.path}` === dashboardId
        }
        return updateDashboard
      })

      this.currentPage.dashboards = newListDashboards
      this.currentDashboard = newListDashboards.find(({ path }) => `${path}` === dashboardId)
    },
    setCurrentGroupPageByLabels(labelGroup) {
      if (!this.listGroupPage.length) {
        return
      }

      this.currentGroupPage = this.listGroupPage.find(({ label }) => label === labelGroup)

      const page = this.currentGroupPage?.pagesDashboards[0]
      this.currentPage = { ...page }
      const { dashboards } = page

      dashboards.forEach((dash) => {
        dash.active = false
      })

      dashboards[0].active = true
      ;[this.currentDashboard] = dashboards
    },
    setCurrentsByLabels({ labelPage, labelDashboard }) {
      if (!this.listGroupPage.length) {
        return
      }

      const selectPage = this.currentGroupPage.pagesDashboards.find(
        ({ label }) => label === labelPage
      )

      const newDashboard = selectPage.dashboards.map((dashboard) => ({
        ...dashboard,
        active: dashboard.label === labelDashboard
      }))
      const selectDashboard = newDashboard.find(({ active }) => active)
      if (!selectDashboard) {
        newDashboard[0].active = true
      }
      selectPage.dashboards = newDashboard
      this.currentPage = selectPage
      this.currentDashboard = selectDashboard || newDashboard[0]
    },
    setFilters(filters) {
      this.filters = filters
    },
    resetFilters() {
      const tsRange = this.filters.tsRange
      this.setFilters({ tsRange })
    },
    async loadCurrentReports() {
      await LoadReportsDataBySelectedDashboard(this.filters, this.reports, this.currentDashboard)
    },
    setCurrentReports(availableReports) {
      this.currentReportsData = availableReports
    },
    setCurrentReportValue(reportInfo) {
      const reportIdx = this.currentReportsData.findIndex(
        (reportItem) => reportItem.id === reportInfo.reportId
      )

      if (reportIdx < 0) return
      this.currentReportsData[reportIdx] = {
        ...this.currentReportsData[reportIdx],
        ...reportInfo
      }
    },

    toggleReportMeanLineStatus(reportId) {
      const reportIdx = this.currentReportsData.findIndex(
        (reportItem) => reportItem.id === reportId
      )
      if (reportIdx < 0) return
      this.currentReportsData[reportIdx].showMeanLine =
        !this.currentReportsData[reportIdx].showMeanLine
    },

    toggleReportMeanLinePerSeriesStatus(reportId) {
      const reportIdx = this.currentReportsData.findIndex(
        (reportItem) => reportItem.id === reportId
      )
      if (reportIdx < 0) return
      this.currentReportsData[reportIdx].showMeanLinePerSeries =
        !this.currentReportsData[reportIdx].showMeanLinePerSeries
    },

    setTimeRange({ tsRangeBegin, tsRangeEnd, meta }) {
      if (!this.filters.tsRange) this.filters.tsRange = {}

      this.filters.tsRange.meta = meta
      this.filters.tsRange.begin = tsRangeBegin
      this.filters.tsRange.end = tsRangeEnd
    },
    filterDatasetUpdate(filterIn) {
      const { fieldName } = filterIn
      if (!this.filters.datasets) {
        this.filters.datasets = []
      }
      const filterIndex = this.filters.datasets.findIndex(
        (dataset) => dataset.fieldName === fieldName
      )
      if (filterIndex === -1) {
        this.filters.datasets.push(filterIn)
      } else {
        this.filters.datasets[filterIndex] = filterIn
      }
    },
    createAndFilter(valueAnd) {
      this.filters.and = {
        ...this.filters.and,
        ...valueAnd,
        meta: { fieldPrefix: 'and_' }
      }
    }
  }
})
