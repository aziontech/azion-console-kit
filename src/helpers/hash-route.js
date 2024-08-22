import { useRoute, useRouter } from 'vue-router'

/**
 * Provides Vue composable functions for managing URL hash filters.
 * @returns {Object} - Composable methods for filter management.
 */
export function useRouteFilterManager() {
  const route = useRoute()
  const router = useRouter()

  /**
   * Encodes a filter object into a base64 string.
   * @param {Object} filter - The filter object to encode.
   * @returns {string} - The base64 encoded string.
   */
  const encodeFilter = (filter) => {
    return btoa(JSON.stringify(filter))
  }

  /**
   * Decodes a base64 string into a filter object.
   * @param {string} hash - The base64 string to decode.
   * @returns {Object} - The decoded filter object.
   */
  const decodeFilter = (hash) => {
    return JSON.parse(atob(hash))
  }

  /**
   * Retrieves the current filter object from the URL hash.
   * @returns {Object|null} - The current filter object or null if not set.
   */
  const getFiltersFromHash = () => {
    const filters = route.query.filters
    return filters ? decodeFilter(filters) : null
  }

  /**
   * Updates the URL hash with the provided filter object.
   * @param {Object} filter - The filter object to set in the URL hash.
   */
  const setFilterInHash = async (filter) => {
    const encodedFilter = encodeFilter(filter)
    console.log('encodedFilter', encodedFilter)

    await router.push({ ...route, query: { ...route.query, filters: encodedFilter } })
  }

  /**
   * Removes the filter object from the URL hash.
   */
  const removeFiltersFromHash = async () => {
    const { filters, ...restQuery } = route.query
    if (filters) {
      await router.push({ ...route, query: restQuery })
    }
  }

  return {
    encodeFilter,
    decodeFilter,
    getFiltersFromHash,
    setFilterInHash,
    removeFiltersFromHash
  }
}
