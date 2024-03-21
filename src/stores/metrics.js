import {
  GROUP_DASHBOARDS,
  REPORTS,
  DATE_TIME_INTERVALS
} from '@modules/real-time-metrics/constants'

import { LoadReportsDataBySelectedDashboard } from '@modules/real-time-metrics/reports'
import {
  LoadDatasetAvailableFilters,
  LoadInfoAvailableFilters
} from '@/modules/real-time-metrics/filters'

import { defineStore } from 'pinia'

export const useMetricsStore = defineStore('metrics', {
  state: () => ({
    group: {
      all: [...GROUP_DASHBOARDS],
      current: {},
      currentPage: {},
      currentDashboard: {}
    },
    reports: {
      all: [...REPORTS],
      current: []
    },
    filters: {
      dateTimeOptions: [...DATE_TIME_INTERVALS],
      isLoading: false,
      selected: {},
      datasetAvailable: [],
      infoAvailable: []
    }
  }),
  getters: {
    getDateTimeFilterOptions: (state) => state.filters.dateTimeOptions,
    getIsLoadingFilters: (state) => {
      return (
        !state.filters.datasetAvailable.length || !Object.keys(state.filters.infoAvailable).length
      )
    },
    getFilterSelect: (state) => state.selectFilter,
    getGroupPages: (state) => state.group.all,
    getCurrentInfo: (state) => ({
      Page: state.group.currentPage.label,
      Dashboard: state.group.currentDashboard.label,
      Group: state.group.current.label
    }),
    getPages: (state) =>
      state.group.current?.pagesDashboards?.map((item, idx) => ({
        idx: idx,
        id: item.id,
        label: item.label,
        path: item.path,
        dashboards: item.dashboards
      })),
    pageCurrent: (state) => state.group.currentPage,
    groupPageCurrent: (state) => state.group.current,
    infoAvailableFiltersCurrent: (state) => state.filters.infoAvailable,
    dashboardCurrent: (state) => state.group.currentDashboard,
    dashboardBySelectedPage: (state) => {
      if (!state.group.current?.pagesDashboards) {
        return []
      }

      const page = state.group.current.pagesDashboards.filter(
        (currentPage) => currentPage.id === state.group.currentPage.id
      )
      const dashboards = page?.[0]?.dashboards || []
      return dashboards
    },
    reportsBySelectedDashboard: (state) => {
      const reports = state.reports.all.filter((report) => {
        const dashboardId = state.group.currentDashboard?.id
        return report.dashboardId === dashboardId
      })
      return reports
    },
    currentIdPageAndDashboard: (state) => {
      const currentIds = {
        pageId: state.group.currentPage.path,
        dashboardId: state.group.currentDashboard.path
      }
      return currentIds
    },
    currentLabelPageAndDashboard: (state) => {
      const currentIds = {
        currentPage: state.group.currentPage.label,
        currentDashboard: state.group.currentDashboard.label
      }
      return currentIds
    },
    getCurrentReportsData: (state) => state.reports.current,
    currentFilters: (state) => state.filters.selected,
    currentSelectedFilters: (state) => {
      const filters = {}
      if (state.filters.selected.datasets) filters.datasets = state.filters.selected.datasets
      if (state.filters.selected.and) {
        filters.and = {}
        for (const andFilter in state.filters.selected.and) {
          if (andFilter === 'meta') continue
          filters.and[andFilter] = state.filters.selected.and[andFilter]
        }
      }
      return filters
    },
    getDatasetAvailableFilters: (state) => {
      return state.filters.datasetAvailable
    },
    getCurrentReportsDataById: (state) => {
      return (id) => state.reports.current.find((report) => report.id === id)
    }
  },
  actions: {
    setFilterSelect(filter) {
      this.selectFilter = filter
    },
    async setDatasetAvailableFilters() {
      const availableFilters = await LoadDatasetAvailableFilters(
        this.group.currentDashboard.dataset
      )
      this.filters.datasetAvailable = availableFilters
    },
    async setInfoAvailableFilters() {
      const availableFilters = await LoadInfoAvailableFilters()
      this.filters.infoAvailable = availableFilters
    },
    setCurrentGroupPage(groupPage) {
      this.group.current = groupPage
    },
    setCurrentPage(page) {
      this.group.currentPage = page
      ;[this.group.currentDashboard] = this.group.currentPage.dashboards
      this.group.currentDashboard.active = true
    },
    setCurrentDashboard(dashboard) {
      this.group.currentDashboard = dashboard
    },
    setInitialPageAndDashboardCurrent() {
      ;[this.group.current] = this.group.all
      ;[this.group.currentPage] = this.group.current.pagesDashboards
      ;[this.group.currentDashboard] = this.group.currentPage.dashboards
      this.group.currentDashboard.active = true
    },
    setInitialCurrentsByIds({ pageId, dashboardId }) {
      this.group.current = this.group.all.find((groupPage) => {
        this.group.currentPage = groupPage.pagesDashboards.find(({ path }) => `${path}` === pageId)
        return this.group.currentPage
      })

      const newListDashboards = this.group.currentPage.dashboards.map((dashboard) => {
        const updateDashboard = {
          ...dashboard,
          active: `${dashboard.path}` === dashboardId
        }
        return updateDashboard
      })

      this.group.currentPage.dashboards = newListDashboards
      this.group.currentDashboard = newListDashboards.find(({ path }) => `${path}` === dashboardId)
    },
    setCurrentGroupPageByLabels(labelGroup) {
      this.currentGroupPage = this.group.all.find(({ label }) => label === labelGroup)

      const page = this.group.current?.pagesDashboards[0]
      this.group.currentPage = { ...page }
      const { dashboards } = page

      dashboards.forEach((dash) => {
        dash.active = false
      })

      dashboards[0].active = true
      ;[this.group.currentDashboard] = dashboards
    },
    setCurrentsByLabels({ labelPage, labelDashboard }) {
      const selectPage = this.group.current.pagesDashboards.find(({ label }) => label === labelPage)

      const newDashboard = selectPage.dashboards.map((dashboard) => ({
        ...dashboard,
        active: dashboard.label === labelDashboard
      }))
      const selectDashboard = newDashboard.find(({ active }) => active)
      if (!selectDashboard) {
        newDashboard[0].active = true
      }
      selectPage.dashboards = newDashboard
      this.group.currentPage = selectPage
      this.group.currentDashboard = selectDashboard || newDashboard[0]
    },
    setFilters(filters) {
      this.filters.selected = filters
    },
    resetFilters() {
      const tsRange = this.filters.selected.tsRange
      this.setFilters({ tsRange })
    },
    async loadCurrentReports() {
      await LoadReportsDataBySelectedDashboard(
        this.filters.selected,
        this.reports.all,
        this.group.currentDashboard
      )
    },
    setCurrentReports(availableReports) {
      this.reports.current = availableReports
    },
    setCurrentReportValue(reportInfo) {
      const reportIdx = this.reports.current.findIndex(
        (reportItem) => reportItem.id === reportInfo.reportId
      )

      if (reportIdx < 0) return
      this.reports.current[reportIdx] = {
        ...this.reports.current[reportIdx],
        ...reportInfo
      }
    },

    toggleReportMeanLineStatus(reportId) {
      const reportIdx = this.reports.current.findIndex((reportItem) => reportItem.id === reportId)
      if (reportIdx < 0) return
      this.reports.current[reportIdx].showMeanLine = !this.reports.current[reportIdx].showMeanLine
    },

    toggleReportMeanLinePerSeriesStatus(reportId) {
      const reportIdx = this.reports.current.findIndex((reportItem) => reportItem.id === reportId)
      if (reportIdx < 0) return
      this.reports.current[reportIdx].showMeanLinePerSeries =
        !this.reports.current[reportIdx].showMeanLinePerSeries
    },

    setTimeRange({ tsRangeBegin, tsRangeEnd, meta }) {
      if (!this.filters.selected.tsRange) this.filters.selected.tsRange = {}

      this.filters.selected.tsRange.meta = meta
      this.filters.selected.tsRange.begin = tsRangeBegin
      this.filters.selected.tsRange.end = tsRangeEnd
    },
    filterDatasetUpdate(filterIn) {
      const { fieldName } = filterIn
      if (!this.filters.selected.datasets) {
        this.filters.selected.datasets = []
      }
      const filterIndex = this.filters.selected.datasets.findIndex(
        (dataset) => dataset.fieldName === fieldName
      )
      if (filterIndex === -1) {
        this.filters.selected.datasets.push(filterIn)
      } else {
        this.filters.selected.datasets[filterIndex] = filterIn
      }
    },
    createAndFilter(valueAnd) {
      this.filters.selected.and = {
        ...this.filters.selected.and,
        ...valueAnd,
        meta: { fieldPrefix: 'and_' }
      }
    }
  }
})
