import { queryClient } from './queryClient'

/**
 * Extracts placeholder data from TanStack Query list cache
 * Used to provide instant UI feedback while loading detail data
 *
 * @param {Array} listQueryKey - The base query key for the list (e.g., queryKeys.edgeApp.all)
 * @param {string|number} resourceId - The ID of the resource to extract
 * @param {string} idField - The field name for the ID (defaults to 'id')
 * @returns {Object|undefined} - The cached item if found, undefined otherwise
 */
export function getPlaceholderFromCache(listQueryKey, resourceId, idField = 'id') {
  if (!listQueryKey || !resourceId) {
    return undefined
  }

  const cachedQueries = queryClient
    .getQueryCache()
    .findAll({ queryKey: listQueryKey, exact: false })

  for (const query of cachedQueries) {
    const data = query.state.data

    if (!data) continue

    if (data.body && Array.isArray(data.body)) {
      const item = data.body.find((item) => item?.[idField] === resourceId)
      if (item) return item
    }

    if (Array.isArray(data)) {
      const item = data.find((item) => item?.[idField] === resourceId)
      if (item) return item
    }
  }

  return undefined
}
