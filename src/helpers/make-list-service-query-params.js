/**
 * Makes URLSearchParams for GET /{service} endpoints.
 *
 * @param {Object} opts
 * @param {string} opts.fields - Fields to include in the response, separated by commas.
 * @param {string} opts.ordering - Field to order results by.
 * @param {number} opts.page - Page number (1-indexed).
 * @param {number} opts.pageSize - Number of results per page.
 * @param {number} opts.search - String to filter results.
 * @param {string} opts.type - String to filter results.
 * @returns {URLSearchParams}
 */
export const makeListServiceQueryParams = ({ fields, ordering, page, pageSize, search, type }) => {
  const params = new URLSearchParams()
  params.set('ordering', toSnakeCase(ordering))
  params.set('page', page)
  params.set('page_size', pageSize)
  params.set('fields', fields)
  params.set('search', search)
  if (type) params.set('type', type)

  return params
}

const toSnakeCase = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase()
