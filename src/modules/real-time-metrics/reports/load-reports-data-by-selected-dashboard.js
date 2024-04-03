let abortController = null

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
 * Generate reports data based on selected dashboard filters.
 *
 * @param {Array} reports - The list of reports to generate data for.
 * @param {string} currentDashboard - The current dashboard being viewed.
 * @return {Promise} A promise that resolves when all reports data is loaded.
 */
export default async function LoadReportsDataBySelectedDashboard(reports, currentDashboard) {
  if (abortController) abortController.abort()
  const signal = abortController?.signal
  abortController = new AbortController()

  const availableReports = reportsBySelectedDashboard(reports, currentDashboard)

  return { availableReports, signal }
}
