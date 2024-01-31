const HOURS_TO_MSEC = 3_600_000

/**
 * Remove the specified amount of hours from the given date
 *
 * @param {number} pOffset - The number of hours to remove
 * @param {Date} pDate - The date from which to remove the hours
 * @returns {Date} The new date after removing the specified hours
 */
function removeSelectedAmountOfHours(pOffset, pDate) {
  const offset = Number(pOffset)
  const offsetTimestamp = offset * HOURS_TO_MSEC
  const calculatedTimestamp = pDate.getTime() - offsetTimestamp
  const calculatedDate = new Date(calculatedTimestamp)

  return calculatedDate
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

export { removeSelectedAmountOfHours, formatToEndOfDayIsoDate, convertOffsetToDecimal }

/**
 * Set the current date to UTC0 and remove Timezone tag
 *
 * @returns {string} Date without timezone
 */
Date.prototype.removeZone = function () {
  const dateWithUserTimezone = this.toISOString()
  const dateWithoutZone = dateWithUserTimezone.replace(/(\..+)/, '')
  return dateWithoutZone
}

/**
 * Convert current date to the UTC informed
 *
 * @param {number} userUTC - The UTC offset to convert the date to
 * @returns {Date} The new date converted to the specified UTC
 */
Date.prototype.toUTC = function (userUTC = 0) {
  const tz = Number(userUTC)
  const tzTimeStamp = (tz / 100) * HOURS_TO_MSEC
  const dateWithUserTimezone = new Date(this.getTime() + tzTimeStamp)
  const dateWithoutZone = dateWithUserTimezone.toBeholderFormat()
  return new Date(dateWithoutZone)
}

/**
 * Reset the current date according to the specified UTC offset
 *
 * @param {number} userUTC - The UTC offset to reset the date to
 * @returns {Date} The new date reset to the specified UTC
 */
Date.prototype.resetUTC = function (userUTC = 0) {
  const regexpChangeUTC = /(.+)([+|-]\d+)(.+)/g
  const injectUserUTC = this.toString().replace(regexpChangeUTC, `$1${userUTC}$3`)

  return new Date(injectUserUTC)
}

/**
 * Format date as the Beholder standard
 *
 * @returns {string} Date in Beholder format
 */
Date.prototype.toBeholderFormat = function () {
  return this.toISOString().replace(/(\..+)/, '')
}

/**
 * Convert the date from the local format to the Beholder format
 *
 * @returns {string} Date in Beholder format
 */
Date.prototype.fromLocaletoBeholderFormat = function () {
  const toLocale = this.toLocaleString('en-GB')
  const parts = toLocale.split(/\/|, /)
  const day = parts[0]
  const month = parts[1]
  const year = parts[2]
  const time = parts[3]

  return `${year}-${month}-${day}T${time}`
}

/**
 * Converts the instance of Date to the local timezone based on the provided UTC offset.
 *
 * @param {string} utcOffset - The UTC offset for the desired timezone.
 * @returns {string} The date converted to the local timezone in ISO format.
 */
Date.prototype.convertDateToLocalTimezone = function (utcOffset) {
  const userOffset = convertOffsetToDecimal(utcOffset)
  const timeZoneOffsetMinutesToMilli = this.getTimezoneOffset() * 60000
  const toUTC = this.getTime() + timeZoneOffsetMinutesToMilli
  const offsetHoursToMilli = userOffset * 3600000

  const userRealDate = new Date(toUTC + offsetHoursToMilli)
  return formatToEndOfDayIsoDate(userRealDate)
}
