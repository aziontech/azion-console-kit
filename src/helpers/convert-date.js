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
    hour12: true
  }
  return date.toLocaleString('en-US', options)
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

export { convertValueToDate, convertDateToLocalTimezone }
