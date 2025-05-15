const ERROR_MESSAGES = {
  CONNECTION_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.'
}

const formatPath = (path) => {
  const prefix = '/data/'

  if (!path.startsWith(prefix)) return null

  const rest = path.slice(prefix.length)
  if (!rest) return null

  return rest
    .split('/')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' - ')
}

/**
 * Handles API errors and returns a standardized error response
 * @param {Object} error - The error object from the API call
 * @returns {Object} Standardized error response
 */
export function errorHandler(error) {
  if (!error?.response) {
    return {
      status: 500,
      message: [ERROR_MESSAGES.CONNECTION_ERROR]
    }
  }

  const { status, data } = error.response

  if (data?.errors && Array.isArray(data.errors)) {
    const formattedErrors = data.errors.map((err) => {
      const fieldName = formatPath(err.source?.pointer)
      return fieldName ? `${fieldName}: ${err.detail}` : err.detail
    })

    return {
      status,
      message: [...formattedErrors]
    }
  }

  return {
    status: status || 500,
    message: [error.message || ERROR_MESSAGES.UNEXPECTED_ERROR]
  }
}
