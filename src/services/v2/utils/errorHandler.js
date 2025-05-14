export function errorHandler(error) {
  //https://github.com/aziontech/azion-api-errors/blob/dev/src/azion_api_errors/definitions/vcs_api.json
  console.error('API Error:', error) // eslint-disable-line no-console

  if (!error?.response) {
    return {
      status: 500,
      errors: [
        {
          detail: 'Unable to connect to the server. Please check your internet connection.'
        }
      ]
    }
  }

  // Handle API errors with response data
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return {
      status: error.response.status,
      errors: error.response.data.errors.map((err) => ({
        detail: err.detail
      }))
    }
  }

  // Handle unexpected errors
  return {
    status: error.response?.status || 500,
    errors: [
      {
        detail: error.message || 'An unexpected error occurred. Please try again.'
      }
    ]
  }
}

/**
 * Formats error messages for toast display
 * @param {Object} errorResponse - The error response from errorHandler
 * @returns {string[]} Array of formatted error messages
 */
export function formatErrorsForToast(errorResponse) {
  if (!errorResponse?.errors) return ['An unexpected error occurred']

  return errorResponse.errors.map((error) => {
    if (error.detail) return error.detail
    if (error.title) return error.title
    return 'An unexpected error occurred'
  })
}
