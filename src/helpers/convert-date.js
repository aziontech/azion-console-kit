import { useAccountStore } from '@stores/account'

const MINUTE_IN_MILLISECONDS = 60_000
const HOUR_IN_MILLISECONDS = 3_600_000

/**
 * Converts a given value to a date string in a specific format.
 *
 * @param {number|string|Date} value - The value to be converted to a date string.
 * @returns {string} The date string in 'en-US' locale and in a specific format.
 */
const convertValueToDate = (value) => {
  const date = new Date(value)
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }
  return date.toLocaleString('en-US', options)
}

/**
 * Converts a given date to MM/DD/YYYY format.
 *
 * @param {Date | string | number} value - The date to be formatted. Can be a Date object, a timestamp, or a string that the Date constructor can parse.
 * @returns {string} The formatted date in MM/DD/YYYY format.
 */
const formatDateToUS = (value) => {
  const [year, month, day] = value.split('-')

  const date = new Date(year, month - 1, day)

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

const isDateStringValid = (dateString) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  return dateRegex.test(dateString)
}

/**
 * Converts a given date to MM/DD/YYYY format.
 *
 * @param {Date | string | number} value - The date to be formatted. Can be a Date object, a timestamp, or a string that the Date constructor can parse.
 * @returns {string} The formatted date in MM/DD/YYYY format.
 */
const formatDateToUSBilling = (value) => {
  if (!isDateStringValid(value)) return '---'

  const [year, month, day] = value.split('-')

  const date = new Date(year, month - 1, day)

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Convert separate month and year values and add them together
 *
 * @param {number} month - The month
 * @param {number} year - The year
 * @returns {string} The string date formated MM/YYYY
 */

const formatDateMonthAndYear = (month, year) => {
  const formatMonth = month < 10 ? `0${month}` : month

  return `${formatMonth}/${year}`
}

/**
 * Formats a given date to ISO format without milliseconds.
 *
 * @param {Date} value - The date to be formatted.
 * @returns {string} The date in ISO format.
 */
const formatToEndOfDayIsoDate = (value) => {
  value.setUTCHours(23, 59, 59, 999)
  return value.toISOString().slice(0, -5)
}

/**
 * Converts a given UTC offset to decimal format.
 *
 * @param {string} offset - The UTC offset to be converted.
 * @returns {string} The UTC offset in decimal format.
 */
const convertOffsetToDecimal = (offset) => {
  const [offsetSign, hourTens, hourUnits, minuteTens, minuteUnits] = offset
  const hours = `${hourTens}${hourUnits}`
  const minutes = `${minuteTens}${minuteUnits}`

  const minuteToDecimalConversion = {
    15: 25,
    30: 50,
    45: 75
  }

  const decimalMinutes = minutes > 0 ? minuteToDecimalConversion[minutes] : minutes

  return `${offsetSign}${hours}.${decimalMinutes}`
}

/**
 * Converts the instance of Date to the local timezone based on the provided UTC offset.
 *
 * @param {string} utcOffset - The UTC offset for the desired timezone.
 * @returns {string} The date converted to the local timezone in ISO format.
 */
const convertDateToLocalTimezone = (date, utcOffset) => {
  const userOffset = convertOffsetToDecimal(utcOffset)
  const timeZoneOffsetMinutesToMilli = date.getTimezoneOffset() * MINUTE_IN_MILLISECONDS
  const toUTC = date.getTime() + timeZoneOffsetMinutesToMilli
  const offsetHoursToMilli = userOffset * HOUR_IN_MILLISECONDS

  const userRealDate = new Date(toUTC + offsetHoursToMilli)
  return formatToEndOfDayIsoDate(userRealDate)
}

const getCurrentMonthStartEnd = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const dateInitial = new Date(year, month, 1)
  const dateFinal = new Date(year, month + 1, 0)

  return {
    dateInitial: dateInitial.toISOString().split('T')[0],
    dateFinal: dateFinal.toISOString().split('T')[0]
  }
}

const formatExhibitionDate = (dateString, dateStyle, timeStyle) => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle,
    timeStyle,
    timeZone: 'UTC'
  }).format(new Date(dateString))
}

const formatDateToMonthYear = (date) => {
  if (!date) return ''

  const [year, month] = date.split('-') ?? []
  if (year && month) return `${month}-${year}`

  return []
}

const formatDateToDayMonthYearHour = (date, timezone) => {
  if (!date) return 'Not Available'

  if (typeof date === 'string' && date.match(/^[A-Z][a-z]+\s+\d+,\s+\d{4}/)) {
    return date
  }

  let userTimezone = timezone || 'UTC'

  if (!timezone) {
    try {
      const accountStore = useAccountStore()
      userTimezone = accountStore.accountData?.timezone || 'UTC'
    } catch (error) {
      userTimezone = 'UTC'
    }
  }

  let normalizedDate = date
  if (typeof date === 'string' && date.includes('.')) {
    normalizedDate = date.replace(/(\.\d{3})\d+/, '$1')
  }

  const dateObject = new Date(normalizedDate)

  if (isNaN(dateObject.getTime())) {
    return null
  }

  return dateObject.toLocaleString('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

const getCurrentDateTimeIntl = () => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date())
}

const convertValueToDateByUserTimezone = (value, timezone) => {
  const date = new Date(value)
  const options = {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }
  return date.toLocaleString('en-US', options)
}

/**
 * Calculate remaining days between today and expiration date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {number} Number of days remaining including today
 */
function getRemainingDays(dateStr) {
  if (!dateStr || isNaN(Date.parse(dateStr))) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [year, month, day] = dateStr.split('-').map(Number)
  const expirationDate = new Date(year, month - 1, day)
  expirationDate.setHours(0, 0, 0, 0)

  const diffMs = expirationDate - today
  if (diffMs < 0) return 0

  const days = diffMs / (1000 * 60 * 60 * 24) + 1
  return Math.floor(days)
}

const convertToRelativeTime = (date) => {
  if (!date) return '-'
  const now = new Date()
  const targetDate = new Date(date)
  const diffMs = now.getTime() - targetDate.getTime()
  const diffMinutes = Math.floor(diffMs / MINUTE_IN_MILLISECONDS)
  const diffHours = Math.floor(diffMs / HOUR_IN_MILLISECONDS)
  const diffDays = Math.floor(diffMs / (24 * HOUR_IN_MILLISECONDS))

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes === 1) {
    return '1 minute ago'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`
  }

  if (diffHours === 1) {
    return '1 hour ago'
  }

  if (diffHours < 24) {
    return `${diffHours} hours ago`
  }

  if (diffDays === 1) {
    return 'Yesterday'
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`
  }

  if (diffDays < 14) {
    return 'Last week'
  }

  const targetMonth = targetDate.getMonth()
  const targetYear = targetDate.getFullYear()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  if (targetYear === currentYear) {
    if (currentMonth - targetMonth === 1) {
      return 'Last month'
    }

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]
    return `On ${monthNames[targetMonth]}`
  }

  if (currentYear - targetYear === 1) {
    return 'Last year'
  }

  return `${currentYear - targetYear} years ago`
}

const getOffset = (timeZone = 'UTC', date = new Date()) => {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }))
  const offset = (tzDate.getTime() - utcDate.getTime()) / (60 * 60 * 1000)
  const sinal = offset > 0 ? '+' : ''
  return `UTC${sinal}${offset}`
}

export {
  convertValueToDate,
  convertDateToLocalTimezone,
  formatDateMonthAndYear,
  formatDateToUS,
  formatDateToUSBilling,
  getCurrentMonthStartEnd,
  formatExhibitionDate,
  formatDateToMonthYear,
  convertValueToDateByUserTimezone,
  formatDateToDayMonthYearHour,
  getRemainingDays,
  getCurrentDateTimeIntl,
  convertToRelativeTime,
  getOffset
}
