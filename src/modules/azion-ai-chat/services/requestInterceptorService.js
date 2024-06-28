export const requestInterceptorService = (requestDetails, { sessionId, url, userName }) => {
  const APP_PLATFORM_NAME = 'console'

  requestDetails.body['session_id'] = sessionId
  requestDetails.body['url'] = url
  requestDetails.body['username'] = userName
  requestDetails.body['app'] = APP_PLATFORM_NAME

  return requestDetails
}
