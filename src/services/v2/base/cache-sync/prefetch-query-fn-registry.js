/**
 * Prefetch Query Function Registry
 *
 * Maps query key patterns to their fetch functions (queryFn).
 * Required because TanStack Query's prefetchQuery needs the queryFn,
 * but the queryCache doesn't store it.
 *
 * Registration Pattern:
 * - Register queryFns by exact key or prefix pattern
 * - Lookup uses prefix matching (first matching pattern wins)
 */

/**
 * @typedef {Function} QueryFn
 * @param {Array} queryKey - The query key
 * @returns {Promise<any>} - The fetch result
 */

/**
 * @typedef {Array} QueryKeyPattern
 * Pattern for matching query keys.
 * Each element can be:
 * - A literal value (exact match)
 * - A wildcard '*' (matches any value at that position)
 */

// Internal registry storage
// Map<string, { pattern: QueryKeyPattern, queryFn: QueryFn }>
const registry = new Map()

/**
 * Serializes a pattern or key to a string for storage/lookup.
 * @param {Array} pattern
 * @returns {string}
 */
function patternToString(pattern) {
  return JSON.stringify(pattern)
}

/**
 * Checks if a query key matches a pattern.
 * Pattern can contain '*' as wildcard.
 *
 * @param {Array} queryKey - The actual query key
 * @param {Array} pattern - The pattern to match against
 * @returns {boolean}
 */
function matchesPattern(queryKey, pattern) {
  if (queryKey.length < pattern.length) {
    return false
  }

  // Only match prefix (allows ['application', 'detail', '123'] to match ['application', 'detail'])
  for (let count = 0; count < pattern.length; count++) {
    if (pattern[count] !== '*' && pattern[count] !== queryKey[count]) {
      return false
    }
  }

  return true
}

/**
 * Finds the best matching pattern for a query key.
 * Returns the first matching pattern (registered patterns are stored in order).
 *
 * @param {Array} queryKey
 * @returns {{ pattern: Array, queryFn: Function } | null}
 */
function findMatchingPattern(queryKey) {
  for (const [, entry] of registry) {
    if (matchesPattern(queryKey, entry.pattern)) {
      return entry
    }
  }
  return null
}

export const prefetchRegistry = {
  /**
   * Registers a queryFn for a query key pattern.
   *
   * @param {Array} pattern - Query key pattern (can use '*' as wildcard)
   * @param {QueryFn} queryFn - Fetch function for this pattern
   */
  register(pattern, queryFn) {
    if (!Array.isArray(pattern)) {
      throw new Error('[prefetchRegistry] Pattern must be an array')
    }
    if (typeof queryFn !== 'function') {
      throw new Error('[prefetchRegistry] queryFn must be a function')
    }

    const key = patternToString(pattern)
    registry.set(key, { pattern, queryFn })
  },

  /**
   * Gets the queryFn for a query key.
   * Uses prefix matching to find the appropriate pattern.
   *
   * @param {Array} queryKey - The query key to look up
   * @returns {QueryFn | null} - The queryFn or null if not found
   */
  get(queryKey) {
    if (!Array.isArray(queryKey)) {
      return null
    }

    const match = findMatchingPattern(queryKey)
    return match ? match.queryFn : null
  },

  /**
   * Checks if a queryFn exists for a query key.
   *
   * @param {Array} queryKey - The query key to check
   * @returns {boolean}
   */
  has(queryKey) {
    if (!Array.isArray(queryKey)) {
      return false
    }

    const hasMatch = findMatchingPattern(queryKey) !== null
    return hasMatch
  },

  /**
   * Removes a registered pattern.
   *
   * @param {Array} pattern - The pattern to remove
   * @returns {boolean} - True if the pattern was removed
   */
  unregister(pattern) {
    const key = patternToString(pattern)
    return registry.delete(key)
  },

  /**
   * Clears all registered patterns.
   * Useful for testing.
   */
  clear() {
    registry.clear()
  },

  /**
   * Returns the number of registered patterns.
   * Useful for debugging/testing.
   *
   * @returns {number}
   */
  get size() {
    return registry.size
  },

  /**
   * Returns all registered patterns (for debugging).
   *
   * @returns {Array}
   */
  getAllPatterns() {
    return [...registry.values()].map((entry) => entry.pattern)
  }
}
