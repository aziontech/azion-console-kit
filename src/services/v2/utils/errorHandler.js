export function errorHandler(error) {
  // Log error for debugging
  console.error('API Error:', error)

  if (!error?.response) {
    return {
      status: 500,
      errors: [{
        code: 'NETWORK_ERROR',
        title: 'Connection Error',
        detail: 'Unable to connect to the server. Please check your internet connection.'
      }]
    }
  }

  // Handle API errors with response data
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return {
      status: error.response.status,
      errors: error.response.data.errors.map((error) => ({
        code: error.code || 'API_ERROR',
        title: error.title || 'Error',
        detail: error.detail || 'An unexpected error occurred',
        status: error.status || error.response.status
      }))
    }
  }

  // Handle unexpected errors
  return {
    status: error.response?.status || 500,
    errors: [{
      code: 'UNKNOWN_ERROR',
      title: 'Unexpected Error',
      detail: error.message || 'An unexpected error occurred. Please try again.'
    }]
  }
}

/**
 * Formats error messages for toast display
 * @param {Object} errorResponse - The error response from errorHandler
 * @returns {string[]} Array of formatted error messages
 */
export function formatErrorsForToast(errorResponse) {
  if (!errorResponse?.errors) return ['An unexpected error occurred']

  return errorResponse.errors.map(error => {
    if (error.detail) return error.detail
    if (error.title) return error.title
    return 'An unexpected error occurred'
  })
}
