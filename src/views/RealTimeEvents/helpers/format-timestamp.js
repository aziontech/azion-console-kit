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
