const FUNCTIONS_ENDPOINT = 'v4/workspace/functions'

/**
 * Enriches a list of function instances with the linked Function's name
 * (`functionInstanced`), resolved from the global Functions endpoint.
 *
 * Mirrors what the non-versioned Function services do, but keeps every row:
 * an instance whose Function reference can't be resolved is returned untouched
 * (no `functionInstanced`) instead of being dropped from the listing.
 *
 * @param {Object} args
 * @param {Object} args.http HTTP client exposing `request({ method, url, params })`.
 * @param {Array}  args.items Already-adapted function instances to enrich.
 * @param {Function} args.getReferenceId Extracts the linked Function id from an item.
 * @param {number} [args.pageSize=100] Page size for the reference lookup.
 * @returns {Promise<Array>} The items with `functionInstanced` filled where resolved.
 */
export const enrichFunctionInstanceNames = async ({
  http,
  items,
  getReferenceId,
  pageSize = 100
}) => {
  if (!Array.isArray(items) || items.length === 0) return items ?? []

  const keyOf = (id) => (id === null || id === undefined ? null : String(id))
  const neededIds = new Set(items.map((item) => keyOf(getReferenceId(item))).filter(Boolean))
  if (neededIds.size === 0) return items

  const referenceMap = new Map()

  try {
    let page = 1

    while (neededIds.size > 0) {
      const { data } = await http.request({
        method: 'GET',
        url: FUNCTIONS_ENDPOINT,
        params: { page, pageSize, fields: 'id,name' }
      })

      const results = data?.results ?? []
      if (results.length === 0) break

      for (const reference of results) {
        referenceMap.set(keyOf(reference.id), reference)
        neededIds.delete(keyOf(reference.id))
      }

      if (results.length < pageSize) break
      page += 1
    }
  } catch {
    return items
  }

  return items.map((item) => {
    const reference = referenceMap.get(keyOf(getReferenceId(item)))
    return reference ? { ...item, functionInstanced: reference.name } : item
  })
}
