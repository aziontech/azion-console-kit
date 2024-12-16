/**
 * Extracts the first error message from an API response.
 * For generic errors, returns the detail message.
 * For field validation errors, returns "field: error message".
 *
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The formatted error message.
 */
export const extractApiError = (httpResponse) => {
  const errorBody = httpResponse.body

  if (errorBody.detail) {
    return errorBody.detail
  }

  const findFirstError = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        return `${key}: ${value[0]}`
      }
      if (typeof value === 'object' && value !== null) {
        const nestedError = findFirstError(value)
        if (nestedError) {
          const cleanFieldName = nestedError.replace(/^[^:]+\./, '')
          return cleanFieldName
        }
      }
    }
    return null
  }

  return findFirstError(errorBody) || 'Unknown error occurred'
}
