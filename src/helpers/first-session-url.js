const FIRST_SESSION_URL_KEY = 'azion_first_session_url'

/**
 * Captures the first session URL and stores it in localStorage.
 * This should be called early in the application lifecycle.
 * The URL is only stored once per user session.
 */
export const captureFirstSessionUrl = () => {
  if (typeof window === 'undefined') return null

  // Only capture if not already stored
  if (!localStorage.getItem(FIRST_SESSION_URL_KEY)) {
    const currentUrl = window.location.href
    localStorage.setItem(FIRST_SESSION_URL_KEY, currentUrl)
    return currentUrl
  }

  return getFirstSessionUrl()
}

/**
 * Retrieves the first session URL from localStorage.
 * @returns {string|null} The first session URL or null if not set.
 */
export const getFirstSessionUrl = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(FIRST_SESSION_URL_KEY)
}

/**
 * Clears the first session URL from localStorage.
 * This can be called after the signup flow is complete.
 */
export const clearFirstSessionUrl = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(FIRST_SESSION_URL_KEY)
}
