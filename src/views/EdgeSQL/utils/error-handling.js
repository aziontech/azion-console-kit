/**
 * Padronized error handling for EdgeSQL operations
 */

export const createEdgeSQLErrorHandler = (tracker, toast) => {
  const parseApiError = (error) => {
    const apiError = error.response?.data?.errors?.[0]
    if (!apiError) return null

    return {
      fieldName: apiError.source?.pointer || 'api',
      message: `${apiError.title}: ${apiError.detail}`
    }
  }

  const parseStringError = (error) => {
    return {
      fieldName: 'general',
      message: error.message || error.toString()
    }
  }

  const parseGenericError = (error) => {
    return {
      fieldName: 'no field',
      message: error.message || error.toString() || 'An unexpected error occurred'
    }
  }

  const parseError = (error) => {
    if (error.response?.data?.errors?.[0]) {
      return parseApiError(error)
    } else if (typeof error === 'string') {
      return parseStringError(error)
    } else {
      return parseGenericError(error)
    }
  }

  return {
    handleCreationError: (error, productName = 'Edge SQL Database') => {
      const errorInfo = parseError(error)
      
      tracker?.product?.failedToCreate?.({
        productName,
        errorType: 'api',
        fieldName: errorInfo.fieldName.trim(),
        errorMessage: errorInfo.message
      })?.track()

      return errorInfo
    },

    handleQueryError: (error) => {
      const errorInfo = parseError(error)
      
      toast?.add({
        severity: 'error',
        summary: 'Query Error',
        detail: errorInfo.message,
        life: 6000
      })

      return errorInfo
    },

    handleDeleteError: (error, entityName) => {
      const errorInfo = parseError(error)
      
      toast?.add({
        severity: 'error',
        summary: 'Delete Failed',
        detail: `Failed to delete ${entityName}. ${errorInfo.message}`,
        life: 5000
      })

      return errorInfo
    },

    // eslint-disable-next-line no-unused-vars
    handleGeneralError: (error, context = 'operation') => {
      const errorInfo = parseError(error)
      
      toast?.add({
        severity: 'error',
        summary: 'Error',
        detail: errorInfo.message,
        life: 5000
      })

      return errorInfo
    }
  }
} 