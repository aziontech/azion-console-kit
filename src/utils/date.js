/**
 * Converts a value and time unit to milliseconds
 * @param {number} value - Numeric value
 * @param {string} unit - Time unit (seconds, minutes, hours, etc.)
 * @returns {number} Time in milliseconds
 */
export const getTimeInMs = (value, unit) => {
  const normalizedUnit = (unit || '').toLowerCase().endsWith('s')
    ? (unit || '').toLowerCase()
    : `${(unit || '').toLowerCase()}s`
  const multipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000
  }

  return value * (multipliers[normalizedUnit] || 1000)
}

/**
 * Calculates a date based on a reference date and relative values
 * @param {Date} referenceDate - Reference date
 * @param {number} value - Numeric value
 * @param {string} unit - Time unit
 * @param {string} direction - Direction ('ago'/'from now')
 * @returns {Date} New calculated date
 */
export const calculateRelativeDate = (referenceDate, value, unit, direction) => {
  const timeInMs = getTimeInMs(value, unit)
  return direction === getCurrentMonthLabel().toLowerCase() || direction === 'last'
    ? new Date(referenceDate.getTime() - timeInMs)
    : new Date(referenceDate.getTime() + timeInMs)
}

/**
 * Creates a date range based on relative values
 * @param {number} value - Numeric value
 * @param {string} unit - Time unit
 * @param {string} direction - Direction ('ago'/'from now')
 * @param {Date} referenceDate - Reference date (default: now)
 * @returns {Object} Object with startDate and endDate
 */
export const createRelativeRange = (value, unit, direction, referenceDate = new Date()) => {
  const calculatedDate = calculateRelativeDate(referenceDate, value, unit, direction)

  return direction === getCurrentMonthLabel().toLowerCase() || direction === 'last'
    ? { startDate: calculatedDate, endDate: referenceDate }
    : { startDate: referenceDate, endDate: calculatedDate }
}

/**
 * Creates a date for the start of the day
 * @param {Date} date - Reference date
 * @returns {Date} Date at the start of the day (00:00:00)
 */
export const createStartOfDay = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
/**
 * Creates a date for the end of the day
 * @param {Date} date - Reference date
 * @returns {Date} Date at the end of the day (23:59:59)
 */
export const createEndOfDay = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
}

/**
 * Creates a range for the current week
 * @param {Date} date - Reference date
 * @returns {Object} Object with startDate and endDate of the week
 */
export const createWeekRange = (date) => {
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay())

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  return {
    startDate: createStartOfDay(startOfWeek),
    endDate: createEndOfDay(endOfWeek)
  }
}

/**
 * Validates if a date is valid
 * @param {Date} date - Date to validate
 * @returns {boolean} True if the date is valid
 */
export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Formats a date for display
 * @param {Date} date - Date to format
 * @param {boolean} short - Whether to use short format (without milliseconds)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date
 */
export const formatDateTime = (date, short = false, options = {}) => {
  if (!isValidDate(date)) return ''

  const defaultOptions = {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 24-hour format
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 24-hour format
    }
  }

  const formatOptions = options.short || defaultOptions.short
  const longOptions = options.long || defaultOptions.long

  let formatted = date.toLocaleDateString('en-US', short ? formatOptions : longOptions)

  if (!short) {
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0')
    formatted += `.${milliseconds}`
  }

  return formatted
}

/**
 * Formats a date for display in the format "Aug 15, 2025 @ 15:07:13.854"
 * @param {Date} date - Date to format
 * @returns {string} Date formatted as "Aug 15, 2025 @ 15:07:13.854"
 */
export const formatDateSimple = (date) => {
  if (!isValidDate(date)) return ''

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]

  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  return `${month} ${day}, ${year} @ ${hours}:${minutes}:${seconds}`
}

/**
 * Parses a date string in the format "Aug 15, 2025 @ 15:07:13.854"
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDateSimple = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null

  try {
    const [datePart, timePart] = dateString.split(' @ ')
    if (!datePart || !timePart) return null

    const date = new Date(datePart)
    if (!isValidDate(date)) return null

    const timeComponents = timePart.split(':')
    const hours = parseInt(timeComponents[0])
    const minutes = parseInt(timeComponents[1])

    let seconds = 0
    if (timeComponents[2]) {
      const secondsPart = timeComponents[2].split('.')[0]
      seconds = parseInt(secondsPart)
    }

    date.setHours(hours, minutes, seconds, 0)

    return date
  } catch (error) {
    return null
  }
}

/**
 * Formats a date for display with seconds (DD/MM/YYYY HH:mm:ss)
 * @param {Date} date - Date to format
 * @returns {string} Date formatted as DD/MM/YYYY HH:mm:ss
 */
export const formatDateWithSeconds = (date) => {
  if (!isValidDate(date)) return ''

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

/**
 * Array of months with their corresponding values
 * @type {Object[]}
 */
export const MONTHS = [
  { label: 'January', value: 0 },
  { label: 'February', value: 1 },
  { label: 'March', value: 2 },
  { label: 'April', value: 3 },
  { label: 'May', value: 4 },
  { label: 'June', value: 5 },
  { label: 'July', value: 6 },
  { label: 'August', value: 7 },
  { label: 'September', value: 8 },
  { label: 'October', value: 9 },
  { label: 'November', value: 10 },
  { label: 'December', value: 11 }
]

export const TIME_SLOTS = [
  '00:00',
  '00:30',
  '01:00',
  '01:30',
  '02:00',
  '02:30',
  '03:00',
  '03:30',
  '04:00',
  '04:30',
  '05:00',
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
  '22:30',
  '23:00',
  '23:30'
]

export const RELATIVE_UNITS = [
  { label: 'Minutes', value: 'minutes' },
  { label: 'Hours', value: 'hours' },
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
  { label: 'Months', value: 'months' },
  { label: 'Years', value: 'years' }
]

/**
 * Returns the label for the "ago" direction, dynamically using the current month name.
 * @returns {string}
 */
export const getCurrentMonthLabel = () => {
  const now = new Date()
  return now.toLocaleString('default', { month: 'long' })
}

/**
 * Returns the current hour and minute
 * @returns {string} Current hour and minute
 */
export const getCurrentHourAndMinute = () => {
  const now = new Date()
  return `${now.getHours()}:${now.getMinutes()}`
}

export const RELATIVE_DIRECTIONS = [
  { label: 'From now', value: getCurrentMonthLabel().toLowerCase() }
]

export const COMMON_DATE_RANGES = {
  today: { label: 'Today', value: 'today', maxDays: 1 },
  this_week: { label: 'This week', value: 'this_week', maxDays: 7 },
  last_1_minute: { label: 'Last 1 minute', value: 'last_1_minute', maxDays: 0 },
  last_5_minutes: { label: 'Last 5 minutes', value: 'last_5_minutes', maxDays: 0 },
  last_15_minutes: { label: 'Last 15 minutes', value: 'last_15_minutes', maxDays: 0 },
  last_30_minutes: { label: 'Last 30 minutes', value: 'last_30_minutes', maxDays: 0 },
  last_1_hour: { label: 'Last 1 hour', value: 'last_1_hour', maxDays: 0 },
  last_24_hours: { label: 'Last 24 hours', value: 'last_24_hours', maxDays: 1 },
  last_7_days: { label: 'Last 7 days', value: 'last_7_days', maxDays: 7 },
  last_30_days: { label: 'Last 30 days', value: 'last_30_days', maxDays: 30 },
  last_90_days: { label: 'Last 90 days', value: 'last_90_days', maxDays: 90 },
  last_1_year: { label: 'Last 1 year', value: 'last_1_year', maxDays: 365 }
}
