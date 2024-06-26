export const requestInterceptorService = (requestDetails) => {
  requestDetails.headers['sessionId'] = 'sessionId' // add custom header
  return requestDetails
}
