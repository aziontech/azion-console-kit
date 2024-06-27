export const requestInterceptorService = (requestDetails, { sessionId, url }) => {
  requestDetails.body['session_id'] = sessionId
  requestDetails.body['url'] = url
  return requestDetails
}
