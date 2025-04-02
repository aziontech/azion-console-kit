const DATE_TIME_FILTER_INTERVALS = [
  {
    name: 'Last Hour',
    code: '1'
  },
  {
    name: 'Last 24 Hours',
    code: '24'
  },
  {
    name: 'Last 7 Days',
    code: '168'
  },
  {
    name: 'Last 30 Days',
    code: '720'
  },
  {
    name: 'Last 6 Months',
    code: '4320'
  },
  {
    name: 'Custom time range',
    code: 'custom'
  }
]

const MINUTE_IN_MILLISECONDS = 60_000
const HOUR_IN_MILLISECONDS = 3_600_000
const DAY_IN_MILLISECONDS = 86_400_000

const TWO_AND_A_HALF_DAYS = DAY_IN_MILLISECONDS * 2.5
const SIXTY_DAYS = DAY_IN_MILLISECONDS * 60

const INTERVAL_TO_BE_ADDED = {
  minute: MINUTE_IN_MILLISECONDS,
  hour: HOUR_IN_MILLISECONDS,
  day: DAY_IN_MILLISECONDS
}

const RESAMPLING_INTERVALS = {
  TWO_AND_A_HALF_DAYS,
  SIXTY_DAYS,
  INTERVAL_TO_BE_ADDED
}

const TIME_INTERVALS = {
  DATE_TIME_FILTER_INTERVALS,
  RESAMPLING_INTERVALS,
  HOUR_IN_MILLISECONDS
}

export default TIME_INTERVALS
