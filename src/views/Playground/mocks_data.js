import { CHART_RULES } from '@modules/real-time-metrics/constants'

/**
 * Converts a camelCase string to title case
 * @param {string} text - The camelCase string to convert
 * @returns {string} - The title case string
 */
export function camelToTitle(text) {
  return text
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
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

export const BAR_CHART = {
  data: {
    columns: [
      ['data1', 30, 200, 100, 400, 150, 250],
      ['data2', 130, 100, 140, 200, 150, 50]
    ],
    type: 'bar'
  },
  color: {
    pattern: ['url(#linear-orange)', 'url(#linear-green)']
  },
  tooltip: {
    // eslint-disable-next-line id-length
    contents: function (d, defaultTitleFormat, defaultValueFormat) {
      const { index } = d[0]
      return this.getTooltipContent(
        resetTooltipLabel(d),
        defaultTitleFormat,
        defaultValueFormat,
        () => CHART_RULES.BASE_COLOR_PATTERNS[index]
      )
    }
  }
}
