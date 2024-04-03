let abortController
let signal

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
 * Generates available reports based on the selected dashboard and aborts any ongoing data loading process.
 *
 * @param {Array} reports - The list of all reports.
 * @param {Object} currentDashboard - The currently selected dashboard.
 * @return {Object} An object containing availableReports and the signal for aborting ongoing data loading.
 */
export default function LoadReportsDataBySelectedDashboard(reports, currentDashboard) {
  if (abortController) {
    signal = abortController.signal
    abortController.abort()
  }

  const availableReports = reportsBySelectedDashboard(reports, currentDashboard)

  abortController = new AbortController()

  return { availableReports, signal }
}
