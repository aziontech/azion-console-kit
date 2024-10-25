/**
 * Intercepts the response from the API and extracts relevant information.
 *
 * @param {Object} response - The response object from the API.
 * @returns {Object} The extracted text from the response.
 */
export const responseInterceptorService = ({ choices }) => {
  if (!choices?.length) {
    return
  }
  return {
    text: choices[0].delta?.content
  }
}
  