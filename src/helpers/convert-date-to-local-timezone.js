/**
 * Converts a given date to the local timezone based on the provided UTC offset.
 *
 * @param {string} utcOffset - The UTC offset for the desired timezone.
 * @param {Date} date - The date to be converted.
 * @returns {string} The date converted to the local timezone in ISO format.
 * @throws {Error} Will throw an error if `date` is not an instance of Date.
 */
export const convertDateToLocalTimezone = (utcOffset, date) => {
  if (!(date instanceof Date)) {
    throw new Error('date must be an instance of Date')
  }

  const userOffset = convertOffsetToDecimal(utcOffset)
  const timeZoneOffsetMinutesToMilli = date.getTimezoneOffset() * 60000
  const toUTC = date.getTime() + timeZoneOffsetMinutesToMilli
  const offsetHoursToMilli = userOffset * 3600000

  const userRealDate = new Date(toUTC + offsetHoursToMilli)
  return formatToIsoDate(userRealDate)
}

/**
 * Formats a given date to ISO format.
 *
 * @param {Date} value - The date to be formatted.
 * @returns {string} The date in ISO format.
 */
const formatToIsoDate = (value) => {
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
