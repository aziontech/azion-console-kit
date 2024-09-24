import LoadReportWithMeta from './load-report-with-meta'

/**
 * Asynchronously retrieves the current aggregation for a given report based on the provided filters.
 *
 * @param {object} filters - The filters to apply to the report aggregation.
 * @param {string} report - The name of the report to retrieve the aggregation for.
 * @param {string} userUTC - The user time zone
 * @return {object | null} The current aggregation result for the specified report.
 */
async function getCurrentReportAggregation({ filters, report, userUTC }) {
  try {
    const currentReportResults = await LoadReportWithMeta(filters, report, userUTC)

    const currentAggregation = currentReportResults.resultQuery[report.dataset][0]

    return currentAggregation
  } catch {
    return null
  }
}

/**
 * Calculate the time range difference and adjust the begin and end times accordingly.
 *
 * @param {object} timeRange - The time range object containing tsRange_begin and tsRange_end properties.
 * @return {object} An object with adjusted begin and end times.
 */
function getTimeRangeDifference(timeRange) {
  const { tsRange_begin: tsRangeBegin, tsRange_end: tsRangeEnd } = timeRange

  const begin = new Date(tsRangeBegin)
  const finish = new Date(tsRangeEnd)
  const difference = finish - begin

  return {
    begin: new Date(begin - difference).fromLocaletoBeholderFormat(),
    end: new Date(finish - difference).fromLocaletoBeholderFormat()
  }
}

/**
 * Retrieves the previous aggregation result based on the provided filters and report.
 *
 * @param {Object} filters - The filters to be applied to the report.
 * @param {Object} report - The report object containing the reportQuery and dataset.
 * @param {string} userUTC - The user time zone
 * @return {Object | null} The previous aggregation result.
 */
async function getPreviousReportAggregation({ filters, report, userUTC }) {
  try {
    const previousReportFilter = getTimeRangeDifference(report.reportQuery.variables)

    const newFilters = { ...filters, tsRange: { ...filters.tsRange, ...previousReportFilter } }

    const previousReportResults = await LoadReportWithMeta(newFilters, report, userUTC)

    const previousAggregation = previousReportResults.resultQuery[report.dataset][0]

    return previousAggregation
  } catch {
    return null
  }
}

/**
 * Calculates the percentage difference between the current aggregation and the previous aggregation.
 *
 * @param {object} currentAggregation - the current aggregation object
 * @param {object} previousAggregation - the previous aggregation object
 * @return {number} the percentage difference between the current and previous aggregation values
 */
function getFeedbackDifference(currentAggregation, previousAggregation) {
  if (!currentAggregation || !previousAggregation) {
    return 0
  }

  const currentValue = Object.values(currentAggregation)[0]
  const previousValue = Object.values(previousAggregation)[0]

  if (previousValue === 0) return 0
  return ((currentValue - previousValue) / previousValue) * 100
}

/**
 * Asynchronously loads report aggregation with given filters and report data.
 *
 * @param {Object} filters - the filters to apply
 * @param {Object} report - the report data
 * @param {string} userUTC - the user time zone
 * @return {number} the difference in feedback between current and previous aggregations
 */
export default async function LoadReportVariation({ filters, report, userUTC }) {
  const currentAggregation = await getCurrentReportAggregation({
    filters,
    report,
    userUTC
  })
  const previousAggregation = await getPreviousReportAggregation({
    filters,
    report,
    userUTC
  })

  return getFeedbackDifference(currentAggregation, previousAggregation)
}
