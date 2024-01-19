const SERIES_LIMIT = 16

/**
 * Function that transforms a list of tuples into a list of lists (columns).
 *
 * @param {Array}   data             List of key-value objects with the data
 * @param {String}  dataset          Name of the dataset
 * @param {String}  variable         Name of the variable to display in the legend
 * @param {String}  aggregation      Name of the aggregation used
 * @param {Array}   groupBy          List of grouping variables
 * @param {Boolean} isTopX           Whether the obtained data is in the Top X format
 * @param {String}  xAxis            Name of the X-axis variable, can be empty in case of Top X
 * @param {Array}   additionalSeries List of additional fields to be plotted on the chart
 *
 * @returns {Array} List of data transformed to a column structure.
 */
function convertBeholderToChart({
  data,
  dataset,
  variable,
  aggregation,
  groupBy,
  isTopX,
  xAxis,
  additionalSeries,
  userUTC
}) {
  const xAxisData = []
  // topX data has the groupBy field values as the X-axis
  if (isTopX) {
    xAxisData.push(groupBy[0])
  } else {
    xAxisData.push(xAxis)
  }

  const series = {}

  let lastXAxis = null
  let countValues = 0

  data[dataset].forEach((item) => {
    if (variable !== null || (groupBy !== null && groupBy.length > 0)) {
      let key = variable

      if (variable === null) {
        // eslint-disable-next-line
        key = additionalSeries[0]
      }
      // if there are groupBy values, it needs to generate a specific series for each group value.
      if (groupBy?.length) {
        if (isTopX) {
          xAxisData.push(item[groupBy[0]])
        } else {
          const keyValues = []
          groupBy.forEach((data) => {
            keyValues.push(item[data])
          })
          key = keyValues.join(' - ')
        }
      }

      // Creates the HEADER of the series with the name of aggregation
      if (!(key in series)) {
        if (Object.keys(series).length >= SERIES_LIMIT) {
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
        // eslint-disable-next-line
        value = item[additionalSeries[0]]
      }
      series[key].push(value)
    }

    if (groupBy === null || groupBy.length === 0) {
      additionalSeries.forEach((additionalSerie) => {
        if (countValues === 0) {
          series[additionalSerie] = [additionalSerie]
        }
        let value = 0
        if (additionalSerie in item) {
          value = item[additionalSerie]
        }
        series[additionalSerie].push(value)
      })
    }

    /* 
      since the data is in order, if a different value arrives on the x-axis, it means it's a new point on the chart. In the case of Top X charts, this control is not necessary, as the series already ensure the correct display of the data
      */
    if (!isTopX && (lastXAxis === null || item[xAxis] !== lastXAxis)) {
      // preenche com resultado vazio as séries que nesse ciclo não tiveram registro de dados
      Object.keys(series).forEach((serieKey) => {
        if (series[serieKey].lenght < countValues) series[serieKey].push(0)
      })
      let xValue = item[xAxis]
      if (xAxis === 'ts') {
        xValue = new Date(item.ts).toUTC(userUTC)
      }
      xAxisData.push(xValue)

      lastXAxis = item[xAxis]
      countValues += 1
    }
  })

  const seriesArray = []
  // add values to the end of the series to make them all the same length
  Object.values(series).forEach((item) => {
    let serie = Object.values(item)
    if (item.length < countValues) {
      serie = serie.concat(Array(countValues - item.length).fill(0))
    }
    seriesArray.push(serie)
  })

  // ensures that the X-axis is the first set of data.
  return [xAxisData, ...seriesArray]
}

export default convertBeholderToChart
