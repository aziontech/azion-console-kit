import { loadRealTimeMetricsData } from '@services/real-time-metrics-services'
import FillResultQuery from './fill-result-query'
import ConvertBeholderToChart from './convert-beholder-to-chart'
import GqlRules from './convert-report-meta-to-gql'

/**
 * Removes unfinished register from the given registers based on filterEndDatetime and currentEndDatetime.
 *
 * @param {array} registers - The array of registers to be filtered.
 * @param {object} options - The options object containing filterEndDatetime and currentEndDatetime.
 * @return {array} The filtered array of registers.
 */
function removeUnfinishedRegister(registers, { filterEndDatetime, currentEndDatetime }) {
  const filterEndDate = filterEndDatetime.substr(0, filterEndDatetime.length - 3)
  const currentEndDate = currentEndDatetime.substr(0, currentEndDatetime.length - 3)

  if (filterEndDate === currentEndDate) {
    const datasetName = Object.keys(registers)[0]
    registers[datasetName].pop()
  }

  return registers
}

/**
 * Turn the report meta data into a beholder query, fetch it
 *  and returns the result.
 *
 * Join the filters
 *
 * @param {Object} filters - The filters object
 * @param {Object} report - The report object
 * @param {string} userUTC - The user time zone
 * @returns beholder GraphQL Result
 */
export default async function LoadReportWithMeta(filters, report, userUTC) {
  const { signal } = report

  const newReport = { ...report }
  if (!newReport.filters) newReport.filters = {}

  if (!newReport.hasFeedbackTag) {
    newReport.filters.tsRange = filters.tsRange
  }

  if (filters.and) {
    newReport.filters.and = filters.and
  }

  if (filters.datasets) {
    newReport.filters.datasets = filters.datasets
  }

  const filterLastRegisterFail = {
    filterEndDatetime: filters.tsRange.end,
    currentEndDatetime: new Date().toBeholderFormat()
  }

  const conversionReportToGql = new GqlRules(newReport)
  const query = conversionReportToGql.generateGqlQuery()

  let resultQueryRaw = null

  try {
    resultQueryRaw = await loadRealTimeMetricsData({ query, signal })
  } catch (beholderRequestError) {
    return {
      reportId: report.id,
      gqlQuery: query,
      resultQuery: [],
      resultChart: [],
      error: beholderRequestError
    }
  }

  let resultQuery = resultQueryRaw

  if (!resultQueryRaw) return {}

  const dataset = Object.keys(resultQueryRaw)

  const isTimeSeries = newReport.xAxis === 'ts'

  if (dataset && isTimeSeries) {
    const props = { tsRangeFilter: filters.tsRange, data: resultQuery[dataset] }

    resultQuery[dataset] = FillResultQuery(props)
  }

  const hasDataset = dataset && resultQueryRaw[dataset].length > 1

  if (hasDataset) {
    resultQuery = removeUnfinishedRegister(resultQueryRaw, filterLastRegisterFail)
  }

  let variable = null
  let aggregation = null
  if (report.aggregations) {
    variable = report.aggregations[0].variable
    aggregation = report.aggregations[0].aggregation
  }

  const groupBy = report.groupBy.filter((item) => item !== report.xAxis)

  const resultChart = ConvertBeholderToChart({
    report: newReport,
    data: resultQuery,
    variable,
    aggregation,
    groupBy,
    additionalSeries: report.fields || [],
    userUTC
  })

  return {
    reportId: report.id,
    gqlQuery: query,
    resultQuery,
    resultChart,
    error: false
  }
}
