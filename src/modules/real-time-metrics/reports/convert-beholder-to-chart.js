import { CHART_RULES } from '@modules/real-time-metrics/constants'

/**
 * Fills the series with zeroes to make them all the same length.
 * @param {Object} series - The series to be filled with zeroes.
 * @param {number} countValues - The count of values to fill the series with.
 * @returns {Array} - The series filled with zeroes.
 */
const fillSeriesWithZeroes = (series, countValues) => {
  return Object.values(series).map((item) => {
    let serie = Object.values(item)
    if (item.length < countValues) {
      serie = serie.concat(Array(countValues - item.length).fill(0))
    }
    return serie
  })
}

/**
 * Gets the group by key values from the item.
 * @param {Array} groupBy - The list of grouping variables.
 * @param {Object} item - The item containing the data.
 * @returns {Array} - The group by key values.
 */
const getGroupByKeyValues = (groupBy, item) => {
  return groupBy.map((data) => {
    return item[data]
  })
}

/**
 * Pushes the additionalSerie values to the series.
 * @param {number} countValues - The count of values.
 * @param {Object} series - The series to push the values to.
 * @param {Object} item - The item containing the additionalSerie values.
 * @param {string} additionalSerie - The additionalSerie to push to the series.
 */
const pushToSeries = (countValues, series, item, additionalSerie) => {
  if (countValues === 0) {
    series[additionalSerie] = [additionalSerie]
  }
  let value = 0
  if (additionalSerie in item) {
    value = item[additionalSerie]
  }
  series[additionalSerie].push(value)
}

/**
 * Fills the series with empty results for the cycles that do not have data records
 * @param {Object} series - The series to be filled with zeroes.
 * @param {number} countValues - The count of values to fill the series with.
 */
const fillSeriesKeysWithZeroes = (series, countValues) => {
  Object.keys(series).forEach((serieKey) => {
    if (series[serieKey].lenght < countValues) series[serieKey].push(0)
  })
}

/**
 * Adds extra points to the X-axis data and fills the series with zeroes.
 *
 * @param {Object} options - The options object.
 * @param {Object} options.series - The series to be filled with zeroes.
 * @param {Object} options.item - The item containing the data.
 * @param {string} options.xAxis - The X-axis variable.
 * @param {Array} options.xAxisData - The X-axis data array.
 * @param {string} options.userUTC - The user's UTC.
 * @param {number} options.countValues - The count of values.
 * @returns {string} The X-axis value.
 */
const addExtraPointsToXAxis = ({ series, item, xAxis, xAxisData, userUTC, countValues }) => {
  fillSeriesKeysWithZeroes(series, countValues)

  let xValue = item[xAxis]
  if (xAxis === 'ts') {
    xValue = new Date(item.ts).toUTC(userUTC)
  }
  xAxisData.push(xValue)

  return item[xAxis]
}

/**
 * Determines whether extra points should be added to the X-axis.
 * Since the data is in order, if a different value arrives on the x-axis, it means it's a new point on the
 * chart. In the case of Top X charts, this control is not necessary, as the series already ensure the
 * correct display of the data.
 *
 * @param {boolean} isTopX - Whether the obtained data is in the Top X format.
 * @param {string} lastXAxis - The last X-axis value.
 * @param {Object} item - The item containing the data.
 * @param {string} xAxis - The X-axis variable.
 * @returns {boolean} Whether extra points should be added to the X-axis.
 */

const shouldAddExtraPointsToAxis = (isTopX, lastXAxis, item, xAxis) => {
  return !isTopX && (lastXAxis === null || item[xAxis] !== lastXAxis)
}

/**
 * Determines whether series data should be handled.
 *
 * @param {string} variable - The variable to be displayed in the legend.
 * @param {Array} groupBy - The list of grouping variables.
 * @returns {boolean} Whether series data should be handled.
 */
const shouldHandleSeriesData = (variable, groupBy) => {
  return variable !== null || groupBy?.length
}

/**
 * Checks if the series is within the defined limit.
 *
 * @param {Object} series - The series to be checked.
 * @returns {boolean} Whether the series is within the limit.
 */
const isSeriesBeyondLimits = (series) => {
  return Object.keys(series).length >= CHART_RULES.SERIES_LIMIT
}

/**
 * Formats time series chart data based on the provided report, data, variable, groupBy, and additionalSeries.
 *
 * @param {Object} report - The report object containing chart configuration.
 * @param {Array} data - The data to be formatted.
 * @param {string} variable - The variable to be displayed in the legend.
 * @param {string} aggregation - The aggregation to be applied.
 * @param {Array} groupBy - The list of grouping variables.
 * @param {Array} additionalSeries - The list of additional series to be included in the chart.
 * @return {Array} The formatted chart data, including the X-axis data and series data.
 */
const formatTsChartData = ({
  report,
  data,
  variable,
  aggregation,
  groupBy,
  additionalSeries,
  userUTC
}) => {
  const xAxisData = []
  // topX data has the groupBy field values as the X-axis
  if (report.isTopX) {
    xAxisData.push(groupBy[0])
  } else {
    xAxisData.push(report.xAxis)
  }

  const series = {}

  let lastXAxis = null
  let countValues = 0

  data[report.dataset]?.forEach((item) => {
    if (shouldHandleSeriesData(variable, groupBy)) {
      let key = variable

      if (variable === null) {
        key = additionalSeries[0]
      }

      // if there are groupBy values, it needs to generate a specific series for each group value.
      if (groupBy?.length) {
        if (report.isTopX) {
          xAxisData.push(item[groupBy[0]])
        } else {
          const keyValues = getGroupByKeyValues(groupBy, item)
          key = keyValues.join(' - ')
        }
      }

      // Creates the HEADER of the series with the name of aggregation
      if (!(key in series)) {
        if (isSeriesBeyondLimits(series)) {
          return
        }

        series[key] = [key]
        /* 
          if the series is new and there are already records of other series, it needs to be filled with zero values to ensure correct display in the REPORTS
        */
        if (countValues > 0) {
          series[key] = series[key].concat(Array(countValues).fill(0))
        }
      }

      let value = item[aggregation] || 0
      if (variable === null) {
        value = item[additionalSeries[0]]
      }
      series[key].push(value)
    }

    if (!groupBy?.length) {
      additionalSeries.forEach((additionalSerie) => {
        pushToSeries(countValues, series, item, additionalSerie)
      })
    }

    if (shouldAddExtraPointsToAxis(report.isTopX, lastXAxis, item, report.xAxis)) {
      const props = { series, item, xAxis: report.xAxis, xAxisData, userUTC, countValues }
      const newExtraPoint = addExtraPointsToXAxis(props)

      lastXAxis = newExtraPoint
      countValues += 1
    }
  })

  const seriesArray = fillSeriesWithZeroes(series, countValues)

  // ensures that the X-axis is the first set of data.
  return [xAxisData, ...seriesArray]
}

/**
 * Formats pie chart data based on the provided report and data.
 *
 * @param {Object} report - The report object containing chart configuration.
 * @param {Array} data - The data to be formatted.
 */

const formatPieChartData = ({ report, data }) => {
  const dataset = Object.keys(data)

  return data[dataset].map((item) => {
    return [item[report.groupBy[0]], item[report.fields[0]]]
  })
}

/**
 * Function that transforms a list of tuples into a list of lists (columns).
 *
 * @param {Object}  report           Report object
 * @param {Array}   data             List of key-value objects with the data
 * @param {String}  variable         Name of the variable to display in the legend
 * @param {String}  aggregation      Name of the aggregation used
 * @param {Array}   groupBy          List of grouping variables
 * @param {Array}   additionalSeries List of additional fields to be plotted on the chart
 *
 * @returns {Array} List of data transformed to a column structure.
 */
function ConvertBeholderToChart({
  report,
  data,
  variable,
  aggregation,
  groupBy,
  additionalSeries,
  userUTC
}) {
  switch (report.type) {
    case 'line':
    case 'spline':
      return formatTsChartData({
        report,
        data,
        variable,
        aggregation,
        groupBy,
        additionalSeries,
        userUTC
      })
    case 'pie':
      return formatPieChartData({ report, data })
    default:
      return []
  }
}

export default ConvertBeholderToChart
