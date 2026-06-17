const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

const MS_PER_DAY = 1000 * 60 * 60 * 24

const toDate = (value) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Formats date as "Jan 25, 2023" (no time)
 * @param {string|Date|null} value
 * @returns {string} Formatted date or empty string
 */
export const formatBillingDate = (value) => {
  const date = toDate(value)
  if (!date) return ''
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/**
 * Computes relative day delta between target and now.
 * Examples: 4 → "in 4 days"; 1 → "in 1 day"; 0 → "today"; -2 → "2 days ago"
 * @param {string|Date|null} value
 * @param {Date} [now=new Date()]
 * @returns {string} Relative label or empty string
 */
export const formatRelativeDays = (value, now = new Date()) => {
  const target = toDate(value)
  if (!target) return ''

  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  ).getTime()
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const diffDays = Math.round((startOfTarget - startOfNow) / MS_PER_DAY)

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'in 1 day'
  if (diffDays === -1) return '1 day ago'
  if (diffDays > 0) return `in ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}

/**
 * Formats a date range as "Jan 25, 2026 - Feb 25, 2026"
 * @param {string|Date|null} start
 * @param {string|Date|null} end
 * @returns {string}
 */
export const formatBillingPeriod = (start, end) => {
  const formattedStart = formatBillingDate(start)
  const formattedEnd = formatBillingDate(end)
  if (!formattedStart || !formattedEnd) return ''
  return `${formattedStart} - ${formattedEnd}`
}

/**
 * Formats a timestamp as "Feb 25, 2026, 02:32:22 PM"
 * @param {string|Date|null} value
 * @returns {string}
 */
export const formatLastUpdate = (value) => {
  const date = toDate(value)
  if (!date) return ''
  const month = MONTHS_SHORT[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const meridiem = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const hh = String(hours).padStart(2, '0')
  return `${month} ${day}, ${year}, ${hh}:${minutes}:${seconds} ${meridiem}`
}

/**
 * Formats a date with relative-days suffix as "Feb 25, 2026 (in 4 days)"
 * @param {string|Date|null} value
 * @returns {string}
 */
export const formatNextChargeDate = (value) => {
  const absolute = formatBillingDate(value)
  if (!absolute) return ''
  const relative = formatRelativeDays(value)
  return relative ? `${absolute} (${relative})` : absolute
}

/**
 * Formats absolute price value in the form "$20" or "$19.99".
 * Drops trailing zeros for cents.
 * @param {number|null|undefined} value
 * @param {string} [symbol='$']
 * @returns {string}
 */
export const formatPrice = (value, symbol = '$') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return ''
  const number = Number(value)
  const hasCents = Math.round(number * 100) % 100 !== 0
  return `${symbol}${hasCents ? number.toFixed(2) : number.toFixed(0)}`
}
