/**
 * Intercepts the request details and adds sessionId, url, userName, and app to the request body.
 *
 * @param {Object} requestDetails - The details of the request.
 * @param {string} requestDetails.sessionId - The session ID.
 * @param {string} requestDetails.url - The URL.
 * @param {string} requestDetails.userName - The user name.
 * @return {Object} The modified request details with added properties.
 */
export const requestInterceptorService = (requestDetails, { sessionId, url, userName }) => {
  const APP_PLATFORM_NAME = 'console'

  if (!requestDetails || !requestDetails.body) {
    return
  }

  requestDetails.body['session_id'] = sessionId
  requestDetails.body['url'] = url
  requestDetails.body['username'] = userName
  requestDetails.body['app'] = APP_PLATFORM_NAME

  return requestDetails
}
