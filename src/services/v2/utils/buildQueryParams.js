const toSnakeCase = (str) => {
  if (!str) return ''
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase()
}

/**
 * Builds a query parameter string from an object of parameters
 * @param {Object} paramsObject - The parameters to build the query string from
 * @param {string} paramsObject.fields - The fields to include in the query
 * @param {string} paramsObject.ordering - The ordering of the results
 * @param {number} paramsObject.page - The page number
 * @param {number} paramsObject.pageSize - The number of items per page
 * @param {string} paramsObject.search - The search query
 * @param {string} paramsObject.type - The type of the digital certificate
 * @param {boolean} paramsObject.active - The active status of the digital certificate
 * @param {boolean} paramsObject.isDefault - The default status of the digital certificate
 * @returns {string} The query parameter string
 */
export const buildQueryParams = (paramsObject = {}) => {
  const params = new URLSearchParams()

  const specialMappings = {
    pageSize: 'page_size',
    isDefault: 'is_default',
    max_object_count: 'max_object_count',
    continuation_token: 'continuation_token',
    all_levels: 'all_levels'
  }

  const shouldConvertToString = ['page', 'pageSize', 'page_size', 'max_object_count', 'search']

  Object.entries(paramsObject).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return
    }

    let paramKey = key
    let paramValue = value

    if (key === 'ordering' && value) {
      paramValue = toSnakeCase(value)
    }

    if (specialMappings[key]) {
      paramKey = specialMappings[key]
    }

    if (shouldConvertToString.includes(key) || shouldConvertToString.includes(paramKey)) {
      paramValue = value?.toString()
    }

    if (paramValue !== null && paramValue !== undefined && paramValue !== '') {
      params.set(paramKey.toLowerCase(), paramValue)
    }
  })

  return params.toString()
}
