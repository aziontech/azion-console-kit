/**
 * Sets a value in localStorage with an expiration time.
 *
 * @param {Object} params - The parameters object
 * @param {string} params.key - The key to store the value under
 * @param {any} params.value - The value to store (will be stringified)
 * @param {number} [params.expirationMinutes=60] - Expiration time in minutes
 */
export const setWithExpiration = ({ key, value, expirationMinutes = 60, encrypt = true }) => {
  if (!key) {
    return
  }

  const now = new Date()
  const MILLISECONDS_PER_MINUTE = 60000
  const expiration = new Date(now.getTime() + expirationMinutes * MILLISECONDS_PER_MINUTE)

  const data = {
    value,
    expiresAt: expiration.getTime()
  }
  try {
    const payload = encrypt ? btoa(JSON.stringify(data)) : JSON.stringify(data)
    localStorage.setItem(key, payload)
  } catch (err) {
    // ignore quota or serialization errors
  }
}

/**
 * Gets a value from localStorage if it hasn't expired.
 *
 * @param {string} key - The key to retrieve the value from
 * @returns {any|null} - The stored value or null if expired/not found
 */
export const getWithExpiration = (key, { encrypt = true } = {}) => {
  if (!key) {
    return null
  }

  const stored = localStorage.getItem(key)
  if (!stored) return null

  try {
    const decoded = encrypt ? JSON.parse(atob(stored)) : JSON.parse(stored)
    const now = new Date().getTime()

    if (Number.isFinite(decoded.expiresAt) && now > decoded.expiresAt) {
      localStorage.removeItem(key)
      return null
    }
    return Object.prototype.hasOwnProperty.call(decoded, 'value') ? decoded.value : null
  } catch (error) {
    return null
  }
}
