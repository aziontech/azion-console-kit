/**
 * Converts a given value to a date string in a specific format.
 *
 * @param {number|string|Date} value - The value to be converted to a date string.
 * @returns {string} The date string in 'en-US' locale and in a specific format.
 */
const convertValueToDate = (value) => {
  const date = new Date(value)
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
  return date.toLocaleString('en-US', options)
}

export { convertValueToDate }
