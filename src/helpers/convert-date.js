const HOURS_TO_MSEC = 3_600_000

/**
 * Remove the specified amount of hours from the given date
 *
 * @param {number} pOffset - The number of hours to remove
 * @param {Date} pDate - The date from which to remove the hours
 * @returns {Date} The new date after removing the specified hours
 */
export function removeSelectedAmountOfHours(pOffset, pDate) {
  const offset = Number(pOffset)
  const offsetTimestamp = offset * HOURS_TO_MSEC
  const calculatedTimestamp = pDate.getTime() - offsetTimestamp
  const calculatedDate = new Date(calculatedTimestamp)

  return calculatedDate
}

/**
 * @param {number} userUTC - The UTC offset to convert the date to
 * @returns {Date} The new date converted to the specified UTC
 */
Date.prototype.toUTC = function toUTC(userUTC = 0) {
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
Date.prototype.resetUTC = function resetUTC(userUTC = 0) {
  const regexpChangeUTC = /(.+)([+|-]\d+)(.+)/g
  const injectUserUTC = this.toString().replace(regexpChangeUTC, `$1${userUTC}$3`)

  return new Date(injectUserUTC)
}

/**
 * Format date as the Beholder standard
 *
 * @returns {string} Date in Beholder format
 */
Date.prototype.toBeholderFormat = function toBeholderFormat() {
  return this.toISOString().replace(/(\..+)/, '')
}

/**
 * Convert the date from the local format to the Beholder format
 *
 * @returns {string} Date in Beholder format
 */
Date.prototype.fromLocaletoBeholderFormat = function fromLocaletoBeholderFormat() {
  const toLocale = this.toLocaleString('en-GB')
  const parts = toLocale.split(/\/|, /)
  const day = parts[0]
  const month = parts[1]
  const year = parts[2]
  const time = parts[3]

  return `${year}-${month}-${day}T${time}`
}
