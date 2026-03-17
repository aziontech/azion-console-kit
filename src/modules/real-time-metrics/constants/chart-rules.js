const SERIES_LIMIT = 16

const RESET_COUNT = 0

const MIN_COUNT = 4

const MAX_COUNT = 6

const TO_FIXED_PERCENTAGE = 2

const TO_FIXED_DATA_VOLUME = 1

const SCREEN_SMALL_BREAKPOINT = 1024

const SCREEN_XSMALL_BREAKPOINT = 540

const MEAN_LINE_LABEL = 'Mean Line'

const COLUMN_NAMES_FIELD = {
  sum: 'Total',
  geolocCountryName: 'Country',
  geolocAsn: 'ASN',
  geolocRegionName: 'Region'
}

const DATA_VOLUME = {
  yotta: Math.pow(1024, 8), // 1,208,925,819,614,629,174,706,176
  zetta: Math.pow(1024, 7), // 1,180,591,620,717,411,303,424
  exa: Math.pow(1024, 6), // 1,152,921,504,606,846,976
  peta: Math.pow(1024, 5), // 1,125,899,906,842,624
  tera: Math.pow(1024, 4), // 1,099,511,627,776
  giga: Math.pow(1024, 3), // 1,073,741,824
  mega: Math.pow(1024, 2), // 1,048,576
  kilo: 1024
}

const C3_TYPES = {
  ts: 'timeseries',
  cat: 'category'
}

const GAUGE_COLOR_SCHEMA = {
  regular: ['var(--scale-red)', 'var(--scale-orange)', 'var(--scale-yellow)', 'var(--scale-green)'],
  inverse: ['var(--scale-green)', 'var(--scale-yellow)', 'var(--scale-orange)', 'var(--scale-red)']
}

const LABEL = {
  width: 50,
  rotatedWidth: 80,
  defaultPosition: 'outer-center',
  rotatedPosition: 'outer-middle'
}

const BOTTOM_LEGEND_PADDING = {
  bottom: 16,
  right: 30
}

const BASE_COLOR_PATTERNS = [
  'var(--series-one-color)',
  'var(--series-two-color)',
  'var(--series-three-color)',
  'var(--series-four-color)',
  'var(--series-five-color)',
  'var(--series-six-color)',
  'var(--series-seven-color)',
  'var(--series-eight-color)',
  'var(--series-one-color)',
  'var(--series-two-color)',
  'var(--series-three-color)',
  'var(--series-four-color)',
  'var(--series-five-color)',
  'var(--series-six-color)',
  'var(--series-seven-color)',
  'var(--series-eight-color)'
]

const MEAN_LINE_PATTERN = 'var(--text-color)'

const CHART_RULES = {
  SERIES_LIMIT,
  RESET_COUNT,
  MIN_COUNT,
  MAX_COUNT,
  TO_FIXED_PERCENTAGE,
  TO_FIXED_DATA_VOLUME,
  SCREEN_SMALL_BREAKPOINT,
  SCREEN_XSMALL_BREAKPOINT,
  MEAN_LINE_LABEL,
  DATA_VOLUME,
  C3_TYPES,
  LABEL,
  BOTTOM_LEGEND_PADDING,
  BASE_COLOR_PATTERNS,
  MEAN_LINE_PATTERN,
  GAUGE_COLOR_SCHEMA,
  COLUMN_NAMES_FIELD
}

export default CHART_RULES
