/**
 * Creates URLSearchParams object for list service queries
 * @param {Object} params - Query parameters
 * @param {string} params.fields - Fields to return
 * @param {string} params.ordering - Field to order by
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @returns {URLSearchParams} URLSearchParams object
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
