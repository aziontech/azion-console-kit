import { useAccountStore } from '@stores/account'

/**
 * Format timestamp as compact string for RealTimeEvents.
 * Example: "Apr 22, 2026, 18:47:53"
 *
 * @param {string|Date} time - The timestamp to format
 * @returns {string} Formatted timestamp
 */
export function formatTimestampCompact(time) {
  const accountStore = useAccountStore()
  const timezone = accountStore.accountData?.timezone || 'UTC'

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
