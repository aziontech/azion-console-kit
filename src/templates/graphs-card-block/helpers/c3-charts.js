/* eslint-disable id-length */
import {
  BOTTOM_LEGEND_PADDING,
  C3_TYPES,
  DATA_VOLUME,
  LABEL,
  MAX_COUNT,
  MEAN_LINE_LABEL,
  MIN_COUNT,
  RESET_COUNT,
  SCREEN_SMALL_BREAKPOINT,
  SCREEN_XSMALL_BREAKPOINT,
  TO_FIXED_DATA_VOLUME,
  TO_FIXED_PERCENTAGE
} from '../constants/chart-data'
import { LINE_PATTERNS, MEAN_LINE_PATTERN } from '../constants/color-patterns'

/**
 * Check if the input is a valid date
 * @param {any} date - The input to be checked
 * @returns {boolean} - Returns true if the input is a valid date, otherwise returns false
 */
function isDate(date) {
  const series = date
  // eslint-disable-next-line eqeqeq
  return new Date(series) != 'Invalid Date'
}

/**
 * Check if the input is numeric
 * @param {Array} resultChart - The result chart to be checked
 * @returns {boolean} - Returns true if the input is numeric, otherwise returns false
 */
function isNumeric(resultChart) {
  const series = resultChart[0][1]
  return typeof series === 'number'
}

/**
 * Format the C3 data properties
 * @param {Object} chartData - The chart data
 * @param {Array} resultChart - The result chart
 * @returns {Object} - Returns the formatted C3 data properties
 */
function formatC3DataProp(chartData, resultChart) {
  const data = {
    x: chartData.xAxis,
    type: chartData.type,
    columns: resultChart
  }

  if (isDate(resultChart[0][1])) {
    data.xFormat = '%Y-%m-%dT%H:%M:%S.%LZ'
  }

  return data
}

/**
 * Format the C3 X Axis
 * @param {Object} chartData - The chart data
 * @param {Array} resultChart - The result chart
 * @returns {Object} - Returns the formatted C3 X Axis
 */
function formatC3XAxis(chartData, resultChart) {
  const isSeriesDate = isDate(resultChart[0][1])
  const isSeriesNumeric = isNumeric(resultChart)
  const isRotated = chartData.rotated

  const xAxis = {
    type: isSeriesDate ? C3_TYPES.ts : C3_TYPES.cat,
    tick: {
      count: isSeriesNumeric ? MAX_COUNT : MIN_COUNT,
      outer: false
    }
  }

  if (isSeriesDate) {
    xAxis.tick = {
      ...xAxis.tick,
      format: '%b-%d %H:%M',
      width: LABEL.width
    }
  }

  if (isRotated && !isSeriesDate) {
    xAxis.min = RESET_COUNT
  }

  return xAxis
}

/**
 * Format data for percentage display
 * @param {number} data - The data to be formatted
 * @returns {string} - Returns the formatted data for percentage display
 */
export function formatPercentageDataUnit(data) {
  return Intl.NumberFormat('en', {
    style: 'percent',
    maximumFractionDigits: TO_FIXED_PERCENTAGE,
    minimumFractionDigits: TO_FIXED_PERCENTAGE
  }).format(data / 100)
}

/**
 * Format data for displaying byte unit
 * @param {number} data - The data to be formatted
 * @param {Object} chartData - The chart data
 * @returns {string} - Returns the formatted data for byte unit display
 */
export function formatBytesDataUnit(data, chartData) {
  let value = data
  let unit = 'byte'

  if (chartData.dataUnit === 'bitsPerSecond') {
    unit = 'bit-per-second'
  }

  if (data > DATA_VOLUME.tera) {
    value = data / DATA_VOLUME.tera
    unit = `tera${unit}`
  } else if (data > DATA_VOLUME.giga) {
    value = data / DATA_VOLUME.giga
    unit = `giga${unit}`
  } else if (data > DATA_VOLUME.mega) {
    value = data / DATA_VOLUME.mega
    unit = `mega${unit}`
  } else if (data > DATA_VOLUME.kilo) {
    value = data / DATA_VOLUME.kilo
    unit = `kilo${unit}`
  }

  /**
   * Formatter for byte display
   */
  const byteValueNumberFormatter = Intl.NumberFormat('en', {
    notation: 'compact',
    style: 'unit',
    unit,
    unitDisplay: 'narrow',
    minimumFractionDigits: TO_FIXED_DATA_VOLUME,
    maximumFractionDigits: TO_FIXED_DATA_VOLUME
  })
  return byteValueNumberFormatter.format(value)
}

/**
 * Formats the data unit
 * @param {number} data - The data to be formatted
 * @returns {string} - Returns the formatted data unit
 */
function formatDataUnit(data) {
  const formatter = Intl.NumberFormat('en', { notation: 'compact' })
  return `${formatter.format(data)}`
}

/**
 * Formats the Y axis labels for the C3 chart
 * @param {number} data - The data to be formatted
 * @param {Object} chartData - The chart data
 * @returns {string} - Returns the formatted Y axis labels for the C3 chart
 */
export function formatYAxisLabels(data, chartData) {
  if (chartData.dataUnit === 'bytes' || chartData.dataUnit === 'bitsPerSecond') {
    return formatBytesDataUnit(data, chartData)
  }
  if (chartData.dataUnit === 'percentage') {
    return formatPercentageDataUnit(data)
  }

  const value = formatDataUnit(data)
  if (chartData.dataUnit === 'perSecond') {
    return `${value}/s`
  }

  return value
}

/**
 * Formats the Y axis of the C3 chart
 * @param {Object} chartData - The chart data
 * @returns {Object} - Returns the formatted Y axis of the C3 chart
 */
export function formatC3YAxis(chartData) {
  const isRotated = chartData.rotated
  const yAxis = {
    /**
     * Configuration of the Y axis tick
     */
    tick: {
      count: MAX_COUNT,
      format: (d) => formatYAxisLabels(d, chartData)
    },
    min: !isRotated ? RESET_COUNT : undefined,
    padding: { bottom: 0 }
  }
  if (chartData.maxYAxis) {
    yAxis.max = chartData.maxYAxis
    yAxis.padding.top = 0
  }

  return yAxis
}

/**
 * Sets the legend position based on the window width and chart data
 * @param {Object} chartData - The chart data
 * @param {Array} resultChart - The result of the chart
 * @returns {string} - Returns the legend position based on the conditions
 */
function setLegendPosition(chartData, resultChart) {
  if (window.innerWidth < SCREEN_SMALL_BREAKPOINT) {
    return 'bottom'
  }

  const seriesGreaterThanFive = resultChart && resultChart.slice(1).length > 5
  const columnsGreaterThanTwo = chartData && chartData.columns > 2

  return seriesGreaterThanFive && columnsGreaterThanTwo ? 'right' : 'bottom'
}

/**
 * Generates mean line values for the C3 chart
 * @param {Array} resultChart - The result of the chart
 * @param {number} mean - The mean value
 * @returns {Array} - Returns the mean line values for the C3 chart
 */
function generateMeanLineValues(resultChart, mean) {
  const withoutTsSeries = resultChart.slice(1)
  const numberOfSeries = withoutTsSeries[0]?.slice(1).length
  const meanValues = Array(numberOfSeries).fill(mean)

  return [MEAN_LINE_LABEL, ...meanValues]
}

/**
 * Converts a camelCase string to title case
 * @param {string} text - The camelCase string to convert
 * @returns {string} - The title case string
 */
function camelToTitle(text) {
  const title = text.replace(/([A-Z])/g, ' $1').replace(/([a-zA-Z])(\d+)/g, '$1 $2')
  return title.charAt(0).toUpperCase() + title.slice(1)
}

/**
 * Sets the mean series values for the C3 chart
 * @param {Array} serie - The series data
 * @param {number} seriesTotal - The total of the series
 * @param {Object} chartData - The chart data
 * @returns {Object} - Returns the mean series values and legend for the C3 chart
 */
function setMeanSeriesValues(serie, seriesTotal, chartData) {
  const serieCount = serie.length - 1
  const serieAvg = seriesTotal / serieCount
  const serieMeanLineValues = new Array(serieCount)
  const serieMeanLineLegend = new Array(serieCount)
  const formatedLabelValue = formatYAxisLabels(serieAvg, chartData)
  const serieName = camelToTitle(serie[0])
  serieMeanLineValues.fill(serieAvg).unshift(`${MEAN_LINE_LABEL} - ${serieName}`)
  serieMeanLineLegend
    .fill(serieAvg)
    .unshift(`${MEAN_LINE_LABEL} - ${serieName} - ${formatedLabelValue}`)

  return { serieMeanLineLegend, serieMeanLineValues }
}

/**
 * Get series information for the C3 chart
 * @param {Array} resultChart - The result of the chart
 * @param {Object} chartData - The chart data
 * @param {boolean} hasMeanLineSeries - Indicates if the chart has mean line series
 * @param {boolean} hasMeanLineTotal - Indicates if the chart has mean line total
 * @returns {Object} - Returns the series names, mean line total, and mean line series for the C3 chart
 */
function getSeriesInfos(resultChart, chartData, hasMeanLineSeries, hasMeanLineTotal) {
  const sliced = resultChart.slice(1)

  let seriesNames = {}
  let seriesAccumulator = 0
  let numberOfSeries = 0
  const meanLineSeries = []
  let meanLineTotal = []

  sliced.forEach((series) => {
    let seriesTotal = series.slice(1).reduce((acc, value) => acc + value, 0)
    if (hasMeanLineTotal) {
      seriesAccumulator += seriesTotal
      numberOfSeries += series.slice(1).length
    }
    if (chartData.aggregationType === 'avg' && series.length > 1) {
      seriesTotal /= series.length - 1
    }
    const formattedSeriesTotal = formatYAxisLabels(seriesTotal, chartData)
    const seriesName = camelToTitle(series[0])
    const renamedSeries = `${seriesName} - ${formattedSeriesTotal}`

    seriesNames = { ...seriesNames, [series[0]]: renamedSeries }

    // MeanLine Series
    if (hasMeanLineSeries) {
      const { serieMeanLineLegend, serieMeanLineValues } = setMeanSeriesValues(
        series,
        seriesTotal,
        chartData
      )
      const renamedSerie = { [serieMeanLineValues[0]]: serieMeanLineLegend[0] }
      seriesNames = { ...seriesNames, ...renamedSerie }
      meanLineSeries.push(serieMeanLineValues)
    }
  })

  if (hasMeanLineTotal) {
    const mean = seriesAccumulator / numberOfSeries
    const formattedMeanValues = formatYAxisLabels(mean, chartData)
    const meanLineLabel = `${MEAN_LINE_LABEL} - ${formattedMeanValues}`
    seriesNames = { ...seriesNames, [MEAN_LINE_LABEL]: meanLineLabel }

    meanLineTotal = generateMeanLineValues(resultChart, mean)
  }
  return { seriesNames, meanLineTotal, meanLineSeries }
}

/**
 * Resets the tooltip label by converting the ID to title case
 * @param {Array} tooltipData - The tooltip data to reset
 * @returns {Array} - The tooltip data with the label reset
 */
function resetTooltipLabel(tooltipData) {
  return tooltipData.map((item) => ({
    ...item,
    name: camelToTitle(item.id)
  }))
}

/**
 * Sets the padding for the legend based on the legend position
 * @param {string} legendPosition - The position of the legend
 * @returns {Object|null} - The legend padding object or null
 */
function setLegendPadding(legendPosition) {
  return legendPosition === 'bottom' ? BOTTOM_LEGEND_PADDING : null
}

/**
 * Format the properties for the C3 graph
 *
 * @param {Object} options - The options object
 * @param {Array} options.chartData - The chart data
 * @param {Array} options.resultChart - The result chart
 * @param {boolean} options.hasMeanLineSeries - Flag indicating if the chart has mean line series
 * @param {boolean} options.hasMeanLineTotal - Flag indicating if the chart has mean line total
 * @returns {Object} The formatted C3 graph properties
 */
export default function FormatC3GraphProps({
  chartData,
  resultChart,
  hasMeanLineSeries = false,
  hasMeanLineTotal = false
}) {
  const pattern = [...LINE_PATTERNS]

  const legendPosition = setLegendPosition(chartData, resultChart)

  const { seriesNames, meanLineTotal, meanLineSeries } = getSeriesInfos(
    resultChart,
    chartData,
    hasMeanLineSeries,
    hasMeanLineTotal
  )
  const data = {
    ...formatC3DataProp(chartData, resultChart),
    names: seriesNames
  }

  if (hasMeanLineTotal && resultChart.length > 1) {
    const meanLineIndex = resultChart.length - 1
    pattern.splice(meanLineIndex, 0, MEAN_LINE_PATTERN)

    data.columns = [...data.columns, meanLineTotal]
  }

  if (hasMeanLineSeries && resultChart.length > 1) {
    const meanLineIndexCount = hasMeanLineTotal ? 0 : -1
    const meanLineSeriesIndex = resultChart.length + meanLineIndexCount
    const existsColorPattern = pattern.slice(0, meanLineSeriesIndex)
    pattern.splice(meanLineSeriesIndex, 0, ...existsColorPattern)
    data.columns = [...data.columns, ...meanLineSeries]
  }

  const c3Props = {
    data,
    axis: {
      rotated: chartData.rotated,
      x: formatC3XAxis(chartData, resultChart),
      y: formatC3YAxis(chartData)
    },
    legend: { position: legendPosition },
    padding: setLegendPadding(legendPosition),
    color: { pattern },
    grid: {
      y: {
        show: true
      }
    },
    point: {
      show: false
    },
    tooltip: {
      show: window.innerWidth > SCREEN_XSMALL_BREAKPOINT,
      contents(d, defaultTitleFormat, defaultValueFormat, color) {
        return this.getTooltipContent(
          resetTooltipLabel(d),
          defaultTitleFormat,
          defaultValueFormat,
          color
        )
      },
      format: {
        title: (d) => (isDate(d) ? new Date(d).toLocaleString('en-US') : d)
      }
    },
    zoom: {
      enabled: true
    }
  }

  return c3Props
}
