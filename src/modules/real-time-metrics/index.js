import { GROUP_DASHBOARDS, REPORTS, TIME_INTERVALS } from '@modules/real-time-metrics/constants'
import { LoadReportsDataBySelectedDashboard } from '@modules/real-time-metrics/reports'
import {
  LoadDatasetAvailableFilters,
  LoadInfoAvailableFilters
} from '@/modules/real-time-metrics/filters'

const RealTimeMetricsModule = () => {
  const group = {
    all: [...GROUP_DASHBOARDS],
    current: {},
    currentPage: {},
    currentDashboard: {}
  }

  const reports = {
    all: [...REPORTS],
    current: []
  }

  const filters = {
    dateTimeOptions: [...TIME_INTERVALS.DATE_TIME_FILTER_INTERVALS],
    isLoading: false,
    selected: {},
    datasetAvailable: [],
    infoAvailable: []
  }

  /**
   * Set the dataset available filters asynchronously.
   *
   * @return {Promise<void>} Promise that resolves once the filters are set
   */
  const setDatasetAvailableFilters = async () => {
    const availableFilters = await LoadDatasetAvailableFilters(group.currentDashboard.dataset)
    filters.datasetAvailable = availableFilters
  }

  /**
   * function sets the infoAvailable filters.
   *
   * @return {Promise<void>} A promise that resolves once the available filters are set.
   */
  const setInfoAvailableFilters = async () => {
    const availableFilters = await LoadInfoAvailableFilters()
    filters.infoAvailable = availableFilters
  }

  /**
   * Sets the current group page to the specified value.
   *
   * @param {string} groupPage - The new group page to set.
   * @return {void} function does not return a value.
   */
  const setCurrentGroupPage = (groupPage) => {
    group.current = groupPage
  }

  /**
   * Sets the current page and updates the current dashboard accordingly.
   *
   * @param {Object<import('@modules/real-time-metrics/constants/dashboards').Page>} page - The page object to set as the current page.
   * @return {void} function does not return a value.
   */
  const setCurrentPage = (page) => {
    group.currentPage = page
    ;[group.currentDashboard] = group.currentPage.dashboards
  }

  /**
   * Sets the current dashboard to the provided value.
   *
   * @param {Object<import('@modules/real-time-metrics/constants/dashboards').Dashboard>} dashboard - The new dashboard value to set.
   */
  const setCurrentDashboard = (dashboard) => {
    group.currentDashboard = dashboard
  }

  /**
   * Sets the initial page and dashboard for the current group.
   *
   * @return {void} No return value.
   */
  const setInitialPageAndDashboardCurrent = () => {
    ;[group.current] = group.all
    ;[group.currentPage] = group.current.pagesDashboards
    ;[group.currentDashboard] = group.currentPage.dashboards
  }

  /**
   * Sets the initial current values based on the provided pageId and dashboardId.
   *
   * @param {Object} param - An object containing the pageId and dashboardId.
   * @param {string} param.pageId - The ID of the page.
   * @param {string} param.dashboardId - The ID of the dashboard.
   * @return {void} No return value.
   */
  const setInitialCurrentsByIds = ({ pageId, dashboardId }) => {
    group.current = group.all.find((groupPage) => {
      group.currentPage = groupPage.pagesDashboards.find(({ path }) => `${path}` === pageId)
      return group.currentPage
    })

    group.currentDashboard = group.currentPage.dashboards.find(
      ({ path }) => `${path}` === dashboardId
    )
  }

  /**
   * Sets the current group page by label.
   *
   * @param {string} labelGroup - The label of the group.
   * @return {void} This function does not return a value.
   */
  const setCurrentGroupPageByLabels = (labelGroup) => {
    group.current = group.all.find(({ label }) => label === labelGroup)

    const page = group.current?.pagesDashboards[0]
    group.currentPage = { ...page }
    const { dashboards } = page

    ;[group.currentDashboard] = dashboards
  }

  /**
   * Sets the selected filters to the provided filters.
   *
   * @param {Object} filters - The filters to be set.
   * @return {void} This function does not return a value.
   */
  const setFilters = (filters) => {
    filters.selected = filters
  }

  /**
   * Resets the filters to their default values. tsRange is kept.
   *
   * @return {void} No return value.
   */
  const resetFilters = () => {
    const tsRange = filters.selected.tsRange
    setFilters({ tsRange })
  }

  /**
   * Loads the current reports by selected dashboard. This methods has a circular dependency with the module.
   *
   * @return {Promise<void>} A promise that resolves when the reports are loaded.
   */
  const loadCurrentReports = async () => {
    await LoadReportsDataBySelectedDashboard(filters.selected, reports.all, group.currentDashboard)
  }

  /**
   * Sets the current reports to the provided list of available reports.
   *
   * @param {Array} availableReports - The list of available reports.
   * @return {void} This function does not return a value.
   */
  const setCurrentReports = (availableReports) => {
    reports.current = availableReports
  }

  /**
   * Updates the current report value based on the provided report information.
   *
   * @param {Object} reportInfo - The report information containing the report ID and other details.
   * @return {void} This function does not return a value.
   */
  const setCurrentReportValue = (reportInfo) => {
    const reportIdx = reports.current.findIndex(
      (reportItem) => reportItem.id === reportInfo.reportId
    )

    if (reportIdx < 0) return

    reports.current[reportIdx] = {
      ...reports.current[reportIdx],
      ...reportInfo
    }
  }

  /**
   * Set time range for filters.
   *
   * @param {object} params - Object containing tsRangeBegin, tsRangeEnd, and meta
   * @param {number} params.tsRangeBegin - Start timestamp
   * @param {number} params.tsRangeEnd - End timestamp
   * @param {object} params.meta - Meta object
   * @returns {void}
   */
  const setTimeRange = ({ tsRangeBegin, tsRangeEnd, meta }) => {
    if (!filters.selected.tsRange) filters.selected.tsRange = {}

    filters.selected.tsRange.meta = meta
    filters.selected.tsRange.begin = tsRangeBegin
    filters.selected.tsRange.end = tsRangeEnd
  }

  /**
   * Updates the dataset filter with the given filter object.
   *
   * @param {Object} filterIn - The filter object to be added or updated.
   * @param {string} filterIn.fieldName - The name of the field to be filtered.
   * @return {void} This function does not return a value.
   */
  const filterDatasetUpdate = (filterIn) => {
    const { fieldName } = filterIn
    if (!filters.selected.datasets) {
      filters.selected.datasets = []
    }
    const filterIndex = filters.selected.datasets.findIndex(
      (dataset) => dataset.fieldName === fieldName
    )
    if (filterIndex === -1) {
      filters.selected.datasets.push(filterIn)
    } else {
      filters.selected.datasets[filterIndex] = filterIn
    }
  }

  /**
   * A function that creates and filters based on the provided valueAnd object.
   *
   * @param {Object} valueAnd - The object containing filter values for 'and' selection.
   * @param {string} valueAnd.fieldName - The name of the field to be filtered.
   * @param {string} valueAnd.fieldValue - The value of the field to be filtered.
   * @return {void} This function does not return a value.
   */
  const createAndFilter = (valueAnd) => {
    filters.selected.and = {
      ...filters.selected.and,
      ...valueAnd,
      meta: { fieldPrefix: 'and_' }
    }
  }

  return {
    group,
    reports,
    filters,
    actions: {
      setDatasetAvailableFilters,
      setInfoAvailableFilters,
      setFilters,
      resetFilters,
      loadCurrentReports,
      setCurrentReports,
      setCurrentReportValue,
      setTimeRange,
      filterDatasetUpdate,
      createAndFilter,
      setCurrentDashboard,
      setCurrentPage,
      setCurrentGroupPageByLabels,
      setInitialPageAndDashboardCurrent,
      setCurrentGroupPage,
      setInitialCurrentsByIds
    }
  }
}

export default RealTimeMetricsModule
