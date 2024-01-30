/* eslint-disable id-length */
import {
  RESET_COUNT,
  MAX_COUNT,
  MIN_COUNT,
  C3_TYPES,
  LABEL,
  TO_FIXED_PERCENTAGE,
  DATA_VOLUME,
  TO_FIXED_DATA_VOLUME,
  SCREEN_SMALL_BREAKPOINT,
  SCREEN_XSMALL_BREAKPOINT,
  BOTTOM_LEGEND_PADDING,
  MEAN_LINE_LABEL
} from '../constants/chart-data'
import { LINE_PATTERNS, MEAN_LINE_PATTERN } from '../constants/color-patterns'

/**
 * Verifica se o valor é uma data
 * @param {string} date - O valor a ser verificado
 * @returns {boolean} - Retorna true se for uma data válida, senão retorna false
 */
function isDate(date) {
  const series = date
  // eslint-disable-next-line eqeqeq
  return new Date(series) != 'Invalid Date'
}

/**
 * Verifica se o valor é numérico
 * @param {Array} resultChart - O gráfico de resultados
 * @returns {boolean} - Retorna true se for numérico, senão retorna false
 */
function isNumeric(resultChart) {
  const series = resultChart[0][1]
  return typeof series === 'number'
}

/**
 * Formata os dados para a propriedade do gráfico C3
 * @param {Object} chartData - Os dados do gráfico
 * @param {Array} resultChart - O gráfico de resultados
 * @returns {Object} - Retorna os dados formatados para a propriedade do gráfico C3
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
 * Formata o eixo X do gráfico C3
 * @param {Object} chartData - Os dados do gráfico
 * @param {Array} resultChart - O gráfico de resultados
 * @returns {Object} - Retorna o objeto do eixo X formatado para o gráfico C3
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
 * Formata os dados para exibição de porcentagem
 * @param {number} data - Os dados a serem formatados
 * @returns {string} - Retorna os dados formatados para exibição de porcentagem
 */
export function formatPercentageDataUnit(data) {
  return Intl.NumberFormat('en', {
    style: 'percent',
    maximumFractionDigits: TO_FIXED_PERCENTAGE,
    minimumFractionDigits: TO_FIXED_PERCENTAGE
  }).format(data / 100)
}

/**
 * Formata os dados para exibição de bytes
 * @param {number} data - Os dados a serem formatados
 * @param {Object} chartData - Os dados do gráfico
 * @returns {string} - Retorna os dados formatados para exibição de bytes
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
   * Formatter para exibição de bytes
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
 * Formata os dados para exibição de unidade genérica
 * @param {number} data - Os dados a serem formatados
 * @returns {string} - Retorna os dados formatados para exibição de unidade genérica
 */
function formatDataUnit(data) {
  const formatter = Intl.NumberFormat('en', { notation: 'compact' })
  return `${formatter.format(data)}`
}

/**
 * Formata os rótulos do eixo Y do gráfico C3
 * @param {number} data - Os dados a serem formatados
 * @param {Object} chartData - Os dados do gráfico
 * @returns {string} - Retorna os rótulos formatados para o eixo Y do gráfico C3
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
 * Formata o eixo Y do gráfico C3
 * @param {Object} chartData - Os dados do gráfico
 * @returns {Object} - Retorna o objeto do eixo Y formatado para o gráfico C3
 */
export function formatC3YAxis(chartData) {
  const isRotated = chartData.rotated
  const yAxis = {
    /**
     * Configuração do tick do eixo Y
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
 * Define a posição da legenda do gráfico
 * @param {Object} chartData - Os dados do gráfico
 * @param {Array} resultChart - O resultado do gráfico
 * @returns {string} - Retorna a posição da legenda do gráfico
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
 * Gera os valores da linha média
 * @param {Array} resultChart - O resultado do gráfico
 * @param {number} mean - O valor médio
 * @returns {Array} - Retorna os valores da linha média
 */
function generateMeanLineValues(resultChart, mean) {
  const withoutTsSeries = resultChart.slice(1)
  const numberOfSeries = withoutTsSeries[0]?.slice(1).length
  const meanValues = Array(numberOfSeries).fill(mean)

  return [MEAN_LINE_LABEL, ...meanValues]
}

/**
 * Converte uma string no formato camelCase para título
 * @param {string} text - A string no formato camelCase
 * @returns {string} - A string convertida para título
 */
function camelToTitle(text) {
  const title = text.replace(/([A-Z])/g, ' $1')
  return title.charAt(0).toUpperCase() + title.slice(1)
}

/**
 * Define os valores da série da média
 * @param {Array} serie - A série de dados
 * @param {number} seriesTotal - O total da série
 * @param {Object} chartData - Os dados do gráfico
 * @returns {Object} - Retorna os valores da série da média
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
 * Obtém as informações das séries do gráfico
 * @param {Array} resultChart - O resultado do gráfico
 * @param {Object} chartData - Os dados do gráfico
 * @param {boolean} hasMeanLineSeries - Indica se o gráfico possui linha média
 * @param {boolean} hasMeanLineTotal - Indica se o gráfico possui linha média total
 * @returns {Object} - Retorna as informações das séries do gráfico
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
 * Reseta o rótulo da dica de ferramenta
 * @param {Array} tooltipData - Os dados da dica de ferramenta a serem resetados
 * @returns {Array} - Retorna os dados da dica de ferramenta com os rótulos resetados
 */
function resetTooltipLabel(tooltipData) {
  return tooltipData.map((item) => ({
    ...item,
    name: camelToTitle(item.id)
  }))
}

/**
 * Função para definir o preenchimento da legenda
 * @param {string} legendPosition - A posição da legenda
 * @returns {Object|null} - Retorna o preenchimento da legenda ou null
 */
function setLegendPadding(legendPosition) {
  return legendPosition === 'bottom' ? BOTTOM_LEGEND_PADDING : null
}

/**
 * Formata as propriedades do gráfico C3
 * @param {Object} options - As opções do gráfico
 * @param {Object} options.chartData - Os dados do gráfico
 * @param {Array} options.resultChart - O resultado do gráfico
 * @param {boolean} options.hasMeanLineSeries - Indica se o gráfico possui série de linha média
 * @param {boolean} options.hasMeanLineTotal - Indica se o gráfico possui linha média total
 * @returns {Object} - Retorna as propriedades formatadas do gráfico C3
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
