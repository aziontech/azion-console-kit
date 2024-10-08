/**
 * Makes URLSearchParams for GET /{service} endpoints.
 *
 * @param {Object} opts
 * @param {string} opts.fields - Fields to include in the response, separated by commas.
 * @param {string} opts.ordering - Field to order results by.
 * @param {number} opts.page - Page number (1-indexed).
 * @param {number} opts.pageSize - Number of results per page.
 * @returns {URLSearchParams}
 */
export const makeListServiceQueryParams = ({ fields, ordering, page, pageSize }) => {
  const params = new URLSearchParams()
  params.set('ordering', ordering)
  params.set('page', page)
  params.set('page_size', pageSize)
  params.set('fields', fields)

  return params
}
