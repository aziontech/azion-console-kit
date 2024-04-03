import LoadReportVariation from './load-report-variation'
import LoadReportWithMeta from './load-report-with-meta'

/**
 * Resolves a report with the given filters and updates the metrics store with the report information.
 *
 * @param {Object} report - The report object containing the report details.
 * @param {Object} filters - The filters to be applied to the report.
 * @param {string} userUTC - The user time zone
 * @param {AbortSignal} signal - The signal to cancel the request.
 * @returns {Promise<Object>} A promise that resolves to the report information.
 */
export default async function ResolveReport(report, filters, userUTC, signal) {
  const maxSeriesToDisplayTag = 2
  const minSeriesToShowMeanLine = 1
  const minSeriesToShowMeanLinePerSeries = 2

  const reportWithCancelation = {
    ...report,
    signal
  }
  const reportData = await LoadReportWithMeta(filters, reportWithCancelation, userUTC)

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
      signal
    }

    reportInfo.variationValue = await LoadReportVariation({
      filters,
      report: clonedReport,
      userUTC
    })
  }

  return reportInfo
}
