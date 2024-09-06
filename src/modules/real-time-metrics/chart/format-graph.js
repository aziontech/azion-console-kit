import { CHART_RULES } from '@modules/real-time-metrics/constants'

/**
 * Format data for displaying byte unit
 * @param {number} data - The data to be formatted
 * @param {Object} chartData - The chart data
 * @returns {string} - Returns the formatted data for byte unit display
 */
export function formatBytesDataUnit(data, chartData) {
  let unit = 'byte'
  let value = data

  if (chartData.dataUnit === 'count') {
    return {
      value: value,
      unit: ''
    }
  }

  if (chartData.dataUnit === 'bitsPerSecond' || chartData.dataUnit === 'bites') {
    return `${parseFloat(value).toFixed(1)} bits/s`
  }

  if (data > CHART_RULES.DATA_VOLUME.tera) {
    value = data / CHART_RULES.DATA_VOLUME.tera
    unit = `tb/s`
  } else if (data > CHART_RULES.DATA_VOLUME.giga) {
    value = data / CHART_RULES.DATA_VOLUME.giga
    unit = `gb/s`
  } else if (data > CHART_RULES.DATA_VOLUME.mega) {
    value = data / CHART_RULES.DATA_VOLUME.mega
    unit = `mb/s`
  } else if (data > CHART_RULES.DATA_VOLUME.kilo) {
    value = data / CHART_RULES.DATA_VOLUME.kilo
    unit = `kb/s`
  }

  return {
    value: parseFloat(value).toFixed(1),
    unit
  }
}
