import { CHART_RULES } from '@modules/real-time-metrics/constants'

// Unit abbreviations for data volume display
const UNIT_ABBREVIATIONS = {
  byte: {
    yotta: 'YB',
    zetta: 'ZB',
    exa: 'EB',
    peta: 'PB',
    tera: 'TB',
    giga: 'GB',
    mega: 'MB',
    kilo: 'KB'
  },
  'bit-per-second': {
    yotta: 'Yb/s',
    zetta: 'Zb/s',
    exa: 'Eb/s',
    peta: 'Pb/s',
    tera: 'Tb/s',
    giga: 'Gb/s',
    mega: 'Mb/s',
    kilo: 'kb/s'
  }
}

/**
 * Format data for displaying byte unit
 * @param {number} data - The data to be formatted
 * @param {Object} chartData - The chart data
 * @returns {Object} - Returns an object with formatted value and unit
 */
export function formatDataUnit(data, chartData) {
  let unit = 'byte'
  let value = data

  if (chartData.dataUnit === 'count') {
    return {
      value: Intl.NumberFormat('en', { notation: 'compact' }).format(value),
      unit: chartData?.aggregations?.[0]?.variable || ''
    }
  }

  if (chartData.dataUnit === 'bitsPerSecond' || chartData.dataUnit === 'bites') {
    return `${parseFloat(value).toFixed(1)} bits/s`
  }

  const unitType = chartData.dataUnit === 'bitsPerSecond' ? 'bit-per-second' : 'byte'
  const abbreviations = UNIT_ABBREVIATIONS[unitType]

  if (data > CHART_RULES.DATA_VOLUME.yotta) {
    value = data / CHART_RULES.DATA_VOLUME.yotta
    unit = abbreviations?.yotta || 'YB'
  } else if (data > CHART_RULES.DATA_VOLUME.zetta) {
    value = data / CHART_RULES.DATA_VOLUME.zetta
    unit = abbreviations?.zetta || 'ZB'
  } else if (data > CHART_RULES.DATA_VOLUME.exa) {
    value = data / CHART_RULES.DATA_VOLUME.exa
    unit = abbreviations?.exa || 'EB'
  } else if (data > CHART_RULES.DATA_VOLUME.peta) {
    value = data / CHART_RULES.DATA_VOLUME.peta
    unit = abbreviations?.peta || 'PB'
  } else if (data > CHART_RULES.DATA_VOLUME.tera) {
    value = data / CHART_RULES.DATA_VOLUME.tera
    unit = abbreviations?.tera || 'TB'
  } else if (data > CHART_RULES.DATA_VOLUME.giga) {
    value = data / CHART_RULES.DATA_VOLUME.giga
    unit = abbreviations?.giga || 'GB'
  } else if (data > CHART_RULES.DATA_VOLUME.mega) {
    value = data / CHART_RULES.DATA_VOLUME.mega
    unit = abbreviations?.mega || 'MB'
  } else if (data > CHART_RULES.DATA_VOLUME.kilo) {
    value = data / CHART_RULES.DATA_VOLUME.kilo
    unit = abbreviations?.kilo || 'KB'
  }

  return {
    value: parseFloat(value).toFixed(1),
    unit
  }
}
