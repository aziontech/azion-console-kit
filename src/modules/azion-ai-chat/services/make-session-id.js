/**
 * Generates a unique session ID if it doesn't already exist.
 *
 * @return {string} The generated session ID.
 */
export const makeSessionId = () => {
  const sessionID = window.crypto.randomUUID()
  return sessionID
}
