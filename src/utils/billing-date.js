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
