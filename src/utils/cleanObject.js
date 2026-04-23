/**
 * Recursively removes undefined, null, and empty string values from an object
 * @param {Object} obj - The object to clean
 * @returns {Object} - Cleaned object with only valid values
 */
export function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return {}
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, value]) => {
        if (value === undefined || value === null) return false
        if (typeof value === 'string' && value.trim() === '') return false
        return true
      })
      .map(([key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value)) {
          return [key, cleanObject(value)]
        }
        return [key, value]
      })
  )
}
