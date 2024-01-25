const HOURS_TO_MSEC = 3_600_000

export function removeSelectedAmountOfHours(pOffset, pDate) {
  const offset = Number(pOffset)
  const offsetTimestamp = offset * HOURS_TO_MSEC
  const calculatedTimestamp = pDate.getTime() - offsetTimestamp
  const calculatedDate = new Date(calculatedTimestamp)

  return calculatedDate
}

/**
 * Convert current date to the UTC informed
 *
 */
// eslint-disable-next-line no-extend-native
Date.prototype.toUTC = function toUTC(userUTC = 0) {
  const tz = Number(userUTC)
  const tzTimeStamp = (tz / 100) * HOURS_TO_MSEC
  const dateWithUserTimezone = new Date(this.getTime() + tzTimeStamp)
  const dateWithoutZone = dateWithUserTimezone.toBeholderFormat()
  return new Date(dateWithoutZone)
}

/**
 * Revert the current date according the UTC informed
 *
 */
// eslint-disable-next-line no-extend-native
Date.prototype.resetUTC = function resetUTC(userUTC = 0) {
  const regexpChangeUTC = /(.+)([+|-]\d+)(.+)/g
  const injectUserUTC = this.toString().replace(regexpChangeUTC, `$1${userUTC}$3`)

  return new Date(injectUserUTC)
}

/**
 * Format date as the Beholder standard
 *
 */
// eslint-disable-next-line no-extend-native
Date.prototype.toBeholderFormat = function toBeholderFormat() {
  return this.toISOString().replace(/(\..+)/, '')
}

/**
 * Format date as the Beholder standard
 *
 */
// eslint-disable-next-line no-extend-native
Date.prototype.fromLocaletoBeholderFormat = function fromLocaletoBeholderFormat() {
  const toLocale = this.toLocaleString('en-GB')
  const parts = toLocale.split(/\/|, /)
  const day = parts[0]
  const month = parts[1]
  const year = parts[2]
  const time = parts[3]

  return `${year}-${month}-${day}T${time}`
}
