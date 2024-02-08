import { useMetricsStore } from '@/stores/metrics'
import Axios from 'axios'
import { LoadReportVariation, LoadReportWithMeta } from '.'

let ReportsRequestTokenSource = null

function reportsBySelectedDashboard(reports, currentDashboard) {
  const reportsList = reports
    .filter((report) => {
      const dashboardId = currentDashboard?.id?.toString()
      return report.dashboardId.toString() === dashboardId
    })
    .map((report) => ({ ...report, resultQuery: [] }))
  return reportsList
}

async function resolveReport(report, filters) {
  const maxSeriesToDisplayTag = 2
  const minSeriesToShowMeanLine = 1
  const minSeriesToShowMeanLinePerSeries = 2

  const reportWithCancelation = {
    ...report,
    ReportsRequestTokenSource
  }
  const reportData = await LoadReportWithMeta(filters, reportWithCancelation)

  const hasAggregation = reportData.resultChart.length <= maxSeriesToDisplayTag

  const reportInfo = {
    reportId: report.id,
    resultQuery: reportData.resultChart,
    reportQuery: reportData.gqlQuery,
    error: reportData.error,
    hasMeanLine: reportData.resultChart > minSeriesToShowMeanLine,
    hasMeanLinePerSeries: reportData.resultChart > minSeriesToShowMeanLinePerSeries,
    hasFeedbackTag: hasAggregation,
    showMeanLine: false,
    showMeanLinePerSeries: false
  }

  if (hasAggregation) {
    const clonedReport = {
      ...JSON.parse(JSON.stringify(report)),
      reportQuery: reportData.gqlQuery,
      xAxis: '',
      groupBy: [],
      noResample: true,
      ReportsRequestTokenSource
    }

    reportInfo.variationValue = await LoadReportVariation({ filters, report: clonedReport })
  }

  const metricsStore = useMetricsStore()
  metricsStore.setCurrentReportValue(reportInfo)
}

export default async (filters, reports, currentDashboard) => {
  if (ReportsRequestTokenSource) ReportsRequestTokenSource.cancel()

  const ReportsRequestToken = Axios.CancelToken
  ReportsRequestTokenSource = ReportsRequestToken.source()

  const availableReports = reportsBySelectedDashboard(reports, currentDashboard)

  const metricsStore = useMetricsStore()

  metricsStore.setCurrentReports(availableReports)

  availableReports.forEach((report) => {
    resolveReport(report, filters)
  })
}
