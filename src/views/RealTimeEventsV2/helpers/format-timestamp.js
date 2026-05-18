/**
 * Format timestamp as compact string for RealTimeEvents.
 * Example: "Apr 22, 2026, 18:47:53"
 *
 * @param {string|Date} time - The timestamp to format
 * @param {string} [timezone='UTC'] - IANA timezone string (e.g. 'America/Sao_Paulo')
 * @returns {string} Formatted timestamp
 */
export function formatTimestampCompact(time, timezone = 'UTC') {
  const date = new Date(time)
  const options = {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }

  return date.toLocaleString('en-US', options)
}

/**
 * Collapse a "Mon DD, YYYY @ HH:MM:SS" pill label to "Mon DD @ HH:MM:SS",
 * dropping the year while preserving seconds. Passthrough strings such as
 * "now", "last 5 minutes" or empty values are returned unchanged.
 *
 * @param {string} dateStr - Pill label to compact
 * @returns {string} Compact label or the original value when no match
 */
export const formatPillDateCompact = (dateStr) => {
  if (!dateStr) return dateStr
  const match = dateStr.match(/^(\w+ \d+),\s*\d{4}\s*@\s*(\d{2}:\d{2}:\d{2})/)
  if (!match) return dateStr
  return `${match[1]} @ ${match[2]}`
}
