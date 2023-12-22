/**
 * Gets the first API error from the response body.
 * @param {Object} body - The response body.
 * @returns {Object|null} The first API error or null if no error is found.
 */
export const getFirstApiError = (body) => {
  for (let key in body) {
    if (Array.isArray(body[key]) && body[key].length > 0) {
      return body[key][0]
    }
  }
  return null
}
