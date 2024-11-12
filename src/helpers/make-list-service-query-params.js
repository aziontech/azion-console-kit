/**
 * Makes URLSearchParams for GET /{service} endpoints.
 *
 * @param {Object} opts
 * @param {string} opts.fields - Fields to include in the response, separated by commas.
 * @param {string} opts.ordering - Field to order results by.
 * @param {number} opts.page - Page number (1-indexed).
 * @param {number} opts.pageSize - Number of results per page.
 * @param {number} opts.search - String to filter results.
 * @returns {URLSearchParams}
 */
export const makeListServiceQueryParams = ({ fields, ordering, page, pageSize, search }) => {
  const searchParams = new URLSearchParams()

  if (fields) searchParams.append('fields', fields)
  if (ordering) searchParams.append('ordering', ordering)
  if (page) searchParams.append('page', page.toString())
  if (pageSize) searchParams.append('page_size', pageSize.toString())
  if (search) searchParams.append('search', search)
  return searchParams
}

const toSnakeCase = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase()
