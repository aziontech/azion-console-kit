const MINUTE_IN_MILLISECONDS = 60_000
const HOUR_IN_MILLISECONDS = 3_600_000
import { useAccountStore } from '@/stores/account'

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
  return new Intl.DateTimeFormat('us', {
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

const formatDateToDayMonthYearHour = (date) => {
  if (!date) return null

  return new Intl.DateTimeFormat('us', {
    dateStyle: 'full',
    timeStyle: 'medium'
  }).format(new Date(date))
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

const formatDateToIso = (date) => {
  const pad = (num) => String(num).padStart(2, '0')

  const newDate = new Date(date)
  newDate.setHours(newDate.getHours() + 3)

  const year = newDate.getFullYear()
  const month = pad(newDate.getMonth() + 1)
  const day = pad(newDate.getDate())
  const hours = pad(newDate.getHours())
  const minutes = pad(newDate.getMinutes())
  const seconds = pad(newDate.getSeconds())

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

const getDateRangeByHourRange = (hourRange) => {
  const accountStore = useAccountStore()
  const startDate = new Date().toUTC(accountStore.account.utc_offset)
  const endDate = new Date().toUTC(accountStore.account.utc_offset)
  startDate.setHours(startDate.getHours() - parseInt(hourRange))
  const formattedStartDate = formatDateToIso(startDate)
  const formattedEndDate = formatDateToIso(endDate)

  return {
    startDate: formattedStartDate,
    endDate: formattedEndDate
  }
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
  formatDateToIso,
  getDateRangeByHourRange
}
