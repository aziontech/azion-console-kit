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
