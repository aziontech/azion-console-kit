/**
 * Generates available reports based on the selected dashboard and aborts any ongoing data loading process.
 *
 * @param {Array} reports - The list of all reports.
 * @param {Object} currentDashboard - The currently selected dashboard.
 * @return {Object} An object containing availableReports and the signal for aborting ongoing data loading.
 */
export default function LoadReportsDataBySelectedDashboard(reports, currentDashboard) {
  return reports
    .filter((report) => {
      const dashboardId = currentDashboard?.id?.toString()
      return report.dashboardId.toString() === dashboardId
    })
    .map((report) => ({ ...report, resultQuery: [] }))
}
