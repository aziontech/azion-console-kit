export function errorHandler(error) {
  console.log('🚀 ~ errorHandler ~ error:', error) // eslint-disable-line no-console

  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return {
      status: error.response.status,
      errors: error.response.data.errors.map((error) => ({
        code: error.code,
        title: error.title,
        detail: error.detail,
        status: error.status
      }))
    }
  }

  return {
    status: error.response.status,
    errors: [
      {
        code: 'UNKNOWN_ERROR',
        title: 'Error unknown',
        detail: error.message || 'An unknown error occurred.'
      }
    ]
  }
}
