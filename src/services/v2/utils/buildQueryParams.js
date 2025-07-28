const toSnakeCase = (str) => {
  if (!str) return ''
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase()
}

/**
 * Builds a query parameter string from an object of parameters
 * @param {Object} params - The parameters to build the query string from
 * @param {string} params.fields - The fields to include in the query
 * @param {string} params.ordering - The ordering of the results
 * @param {number} params.page - The page number
 * @param {number} params.pageSize - The number of items per page
 * @param {string} params.search - The search query
 * @param {string} params.type - The type of the digital certificate
 * @param {boolean} params.active - The active status of the digital certificate
 * @param {boolean} params.isDefault - The default status of the digital certificate
 * @returns {string} The query parameter string
 */
export const buildQueryParams = ({
  fields,
  ordering,
  page,
  pageSize,
  search,
  type,
  active,
  isDefault
}) => {
  const params = new URLSearchParams()
  const paramsMap = {
    ...(ordering && { ordering: toSnakeCase(ordering) }),
    ...(page && { page: page?.toString() }),
    ...(pageSize && { page_size: pageSize?.toString() }),
    ...(search && { search: search?.toString() }),
    ...(type && { type }),
    ...(active && { active }),
    ...(isDefault && { is_default: isDefault }),
    ...(fields && { fields })
  }

  Object.entries(paramsMap)
    .filter((entry) => entry[1] != null)
    .forEach(([key, value]) => params.set(key, value))

  return params.toString()
}
