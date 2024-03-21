const SERIES_LIMIT = 16

const RESET_COUNT = 0

const MIN_COUNT = 4

const MAX_COUNT = 6

const TO_FIXED_PERCENTAGE = 2

const TO_FIXED_DATA_VOLUME = 1

const SCREEN_SMALL_BREAKPOINT = 1024

const SCREEN_XSMALL_BREAKPOINT = 540

const MEAN_LINE_LABEL = 'Mean Line'

const DATA_VOLUME = {
  tera: 1e12,
  giga: 1073741824,
  mega: 1048576,
  kilo: 1024
}

const C3_TYPES = {
  ts: 'timeseries',
  cat: 'category'
}

const LABEL = {
  width: 40,
  defaultPosition: 'outer-center',
  rotatedPosition: 'outer-middle'
}

const BOTTOM_LEGEND_PADDING = {
  bottom: 16,
  right: 30
}

const LINE_PATTERNS = [
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
  LINE_PATTERNS,
  MEAN_LINE_PATTERN
}

export default CHART_RULES
