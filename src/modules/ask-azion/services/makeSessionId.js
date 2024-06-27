let sessionID = null
/**
 * Generates a unique session ID if it doesn't already exist.
 *
 * @return {string} The generated session ID.
 */
export const makeSessionId = () => {
  if (sessionID) {
    return sessionID
  }

  sessionID = window.crypto.randomUUID()
  return sessionID
}
