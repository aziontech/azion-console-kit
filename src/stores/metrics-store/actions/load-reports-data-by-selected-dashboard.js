import { useMetricsStore } from '@/stores/metrics'
import Axios from 'axios'
import { LoadReportWithMeta } from '.'

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
  const reportWithCancelation = {
    ...report,
    ReportsRequestTokenSource
  }
  const reportData = await LoadReportWithMeta(filters, reportWithCancelation)
  const reportInfo = {
    reportId: report.id,
    reportData: reportData.resultChart,
    reportQuery: reportData.gqlQuery,
    error: reportData.error
  }

  const metricsStore = useMetricsStore()
  metricsStore.setCurrentReportValue({ ...reportInfo })
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
