import { TIME_INTERVALS } from '@modules/real-time-metrics/constants'

/**
 * Remove the specified amount of hours from the given date
 *
 * @param {number} pOffset - The number of hours to remove
 * @returns {Date} The new date after removing the specified hours
 */
Date.prototype.removeSelectedAmountOfHours = function (pOffset) {
  const offset = Number(pOffset)
  const offsetTimestamp = offset * TIME_INTERVALS.HOUR_IN_MILLISECONDS
  const calculatedTimestamp = this.getTime() - offsetTimestamp
  const calculatedDate = new Date(calculatedTimestamp)

  return calculatedDate
}

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
  const tzTimeStamp = (tz / 100) * TIME_INTERVALS.HOUR_IN_MILLISECONDS
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
  const [day, month, year, time] = parts

  return `${year}-${month}-${day}T${time}`
}

/**
 * Formats a given date to ISO format without milliseconds.
 *
 * @param {Date} value - The date to be formatted.
 * @returns {string} The date in ISO format.
 */
Date.prototype.formatToEndOfDayIsoDate = (value) => {
  value.setUTCHours(23, 59, 59, 999)
  return value.toISOString().slice(0, -5)
}

/**
 * Converts a given UTC offset to decimal format.
 *
 * @param {string} offset - The UTC offset to be converted.
 * @returns {string} The UTC offset in decimal format.
 */
Date.prototype.convertOffsetToDecimal = function (offset) {
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
Date.prototype.convertDateToLocalTimezone = function (utcOffset) {
  const userOffset = this.convertOffsetToDecimal(utcOffset)
  const timeZoneOffsetMinutesToMilli =
    this.getTimezoneOffset() * TIME_INTERVALS.MINUTE_IN_MILLISECONDS
  const toUTC = this.getTime() + timeZoneOffsetMinutesToMilli
  const offsetHoursToMilli = userOffset * TIME_INTERVALS.HOUR_IN_MILLISECONDS

  const userRealDate = new Date(toUTC + offsetHoursToMilli)
  return this.formatToEndOfDayIsoDate(userRealDate)
}
