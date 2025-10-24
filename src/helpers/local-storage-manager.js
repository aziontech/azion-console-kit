/**
 * Sets a value in localStorage with an expiration time.
 *
 * @param {Object} params - The parameters object
 * @param {string} params.key - The key to store the value under
 * @param {any} params.value - The value to store (will be stringified)
 * @param {number} [params.expirationMinutes=60] - Expiration time in minutes
 */
export const setWithExpiration = ({ key, value, expirationMinutes = 60 }) => {
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

  const encryptedData = btoa(JSON.stringify(data))
  localStorage.setItem(key, encryptedData)
}

/**
 * Gets a value from localStorage if it hasn't expired.
 *
 * @param {string} key - The key to retrieve the value from
 * @returns {any|null} - The stored value or null if expired/not found
 */
export const getWithExpiration = (key) => {
  if (!key) {
    return null
  }

  const encryptedData = localStorage.getItem(key)
  if (!encryptedData) return null

  try {
    const decryptedData = JSON.parse(atob(encryptedData))
    const now = new Date().getTime()

    if (decryptedData.value) {
      localStorage.removeItem(key)
    }

    if (now > decryptedData.expiresAt) {
      return null
    }

    return decryptedData.value
  } catch (error) {
    return null
  }
}
