import { useMetricsStore } from '@/stores/metrics'
import Axios from 'axios'
import LoadReportVariation from './load-report-variation'
import LoadReportWithMeta from './load-report-with-meta'

let tokenSource = null

/**
 * Filters the given list of reports based on the selected dashboard and returns a new list
 * with each report's `resultQuery` property set to an empty array.
 *
 * @param {Array} reports - The list of reports to filter.
 * @param {Object} currentDashboard - The selected dashboard object.
 * @return {Array} The filtered list of reports with each report's `resultQuery` property set to an empty array.
 */
function reportsBySelectedDashboard(reports, currentDashboard) {
  const reportsList = reports
    .filter((report) => {
      const dashboardId = currentDashboard?.id?.toString()
      return report.dashboardId.toString() === dashboardId
    })
    .map((report) => ({ ...report, resultQuery: [] }))
  return reportsList
}

/**
 * Resolves a report with the given filters and updates the metrics store with the report information.
 *
 * @param {Object} report - The report object containing the report details.
 * @param {Object} filters - The filters to be applied to the report.
 * @return {Promise<void>} - A promise that resolves when the report is resolved and the metrics store is updated.
 */
async function resolveReport(report, filters) {
  const maxSeriesToDisplayTag = 2
  const minSeriesToShowMeanLine = 1
  const minSeriesToShowMeanLinePerSeries = 2

  const reportWithCancelation = {
    ...report,
    tokenSource
  }
  const reportData = await LoadReportWithMeta(filters, reportWithCancelation)

  const hasAggregation = reportData.resultChart.length <= maxSeriesToDisplayTag
  const hasResults = reportData.resultChart.length

  const reportInfo = {
    reportId: report.id,
    resultQuery: reportData.resultChart,
    reportQuery: reportData.gqlQuery,
    error: reportData.error,
    hasMeanLine: reportData.resultChart.length > minSeriesToShowMeanLine,
    hasMeanLinePerSeries: reportData.resultChart.length > minSeriesToShowMeanLinePerSeries,
    hasFeedbackTag: hasAggregation,
    showMeanLine: false,
    showMeanLinePerSeries: false
  }

  if (hasAggregation && hasResults) {
    const clonedReport = {
      ...JSON.parse(JSON.stringify(report)),
      reportQuery: reportData.gqlQuery,
      xAxis: '',
      groupBy: [],
      ReportsRequestTokenSource: tokenSource
    }

    reportInfo.variationValue = await LoadReportVariation({ filters, report: clonedReport })
  }

  const metricsStore = useMetricsStore()
  metricsStore.setCurrentReportValue(reportInfo)
}

/**
 * Generate reports data based on selected dashboard filters.
 *
 * @param {Array} filters - The filters to apply to the reports.
 * @param {Array} reports - The list of reports to generate data for.
 * @param {string} currentDashboard - The current dashboard being viewed.
 * @return {Promise} A promise that resolves when all reports data is loaded.
 */
export default async function LoadReportsDataBySelectedDashboard(
  filters,
  reports,
  currentDashboard
) {
  if (tokenSource) tokenSource.cancel()

  const cancelToken = Axios.CancelToken
  tokenSource = cancelToken.source()

  const availableReports = reportsBySelectedDashboard(reports, currentDashboard)

  const metricsStore = useMetricsStore()

  metricsStore.setCurrentReports(availableReports)

  availableReports.forEach((report) => {
    resolveReport(report, filters)
  })
}
