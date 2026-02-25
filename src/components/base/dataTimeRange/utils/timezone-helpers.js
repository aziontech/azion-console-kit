/**
 * Converts a numeric UTC offset (as returned by the timezones API) to the
 * string format used throughout the application (e.g. "+0300", "-0530").
 *
 * The API returns values like 300 for +03:00, -530 for -05:30, etc.
 *
 * @param {number} utcNumber - Numeric UTC offset (e.g. 300, -530, 0)
 * @returns {string} UTC offset string in "+HHMM" format (e.g. "+0300", "-0530")
 */
export const convertUtcNumberToOffset = (utcNumber) => {
  const sign = utcNumber >= 0 ? '+' : '-'
  const abs = Math.abs(utcNumber)
  const hours = Math.floor(abs / 100)
  const minutes = abs % 100
  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  return `${sign}${hh}${mm}`
}
