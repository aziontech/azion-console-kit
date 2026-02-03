const BYTE_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
const BYTES_PER_KILOBYTE = 1024
const COUNT_BILLION = 1000000000
const COUNT_MILLION = 1000000
const COUNT_THOUSAND = 1000
const DECIMAL_PLACES = 1

export const formatMetricValue = (value, type = 'bytes') => {
  if (value === 0 || value === null || value === undefined) {
    return { value: '0', unit: type === 'bytes' ? 'Bytes' : '' }
  }

  if (type === 'bytes') {
    const sizeIndex = Math.floor(Math.log(value) / Math.log(BYTES_PER_KILOBYTE))
    const convertedValue = value / Math.pow(BYTES_PER_KILOBYTE, sizeIndex)
    const formattedValue = convertedValue.toFixed(DECIMAL_PLACES)

    return {
      value: formattedValue,
      unit: BYTE_UNITS[sizeIndex]
    }
  }

  if (type === 'count') {
    if (value >= COUNT_BILLION) {
      return { value: (value / COUNT_BILLION).toFixed(DECIMAL_PLACES), unit: 'B' }
    }
    if (value >= COUNT_MILLION) {
      return { value: (value / COUNT_MILLION).toFixed(DECIMAL_PLACES), unit: 'M' }
    }
    if (value >= COUNT_THOUSAND) {
      return { value: (value / COUNT_THOUSAND).toFixed(DECIMAL_PLACES), unit: 'K' }
    }
    return { value: value.toString(), unit: '' }
  }

  if (type === 'percentage') {
    return { value: value.toFixed(DECIMAL_PLACES), unit: '%' }
  }

  return { value: value.toString(), unit: '' }
}
