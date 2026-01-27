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

  if (errorBody?.errors && Array.isArray(errorBody.errors) && errorBody.errors.length > 0) {
    const error = errorBody.errors[0]
    if (error?.detail && error?.source?.pointer) {
      const field = error.source.pointer.split('/').pop()
      return `${field}: ${error.detail}`
    }
    if (error?.detail) {
      return error.detail
    }
  }

  if (errorBody?.detail && errorBody?.source?.pointer) {
    const field = errorBody.source.pointer.split('/').pop()
    return `${field}: ${errorBody.detail}`
  }

  if (typeof errorBody?.detail === 'string' && errorBody.detail) {
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

  const errorTarget =
    errorBody && typeof errorBody.detail === 'object' && errorBody.detail !== null
      ? errorBody.detail
      : errorBody

  return findFirstError(errorTarget) || 'Unknown error occurred'
}
