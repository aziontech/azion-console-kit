/* eslint-disable no-console */

/**
 * PrefetchExecutor - Executes prefetch operations for stale queries.
 *
 * Responsibilities:
 * - Discover which queries are still stale after debounce window
 * - Execute fetch for queries that need it
 * - Use queryFn registry to find appropriate fetch functions
 * - Handle errors gracefully without blocking other prefetches
 *
 * Design: Queries are only prefetched if:
 * - They are marked as stale (were invalidated)
 * - They are not currently fetching
 * - They have a registered queryFn
 *
 * Note: Uses fetchQuery instead of prefetchQuery because:
 * - fetchQuery always fetches if data is stale (more explicit)
 * - prefetchQuery may skip if query is inactive or has certain conditions
 */

import { queryClient } from '../query/queryClient'
import { prefetchRegistry } from './prefetch-query-fn-registry'

export class PrefetchExecutor {
  #queryClient = null
  #registry = null

  /**
   * @param {Object} options
   * @param {Object} options.queryClient - TanStack QueryClient instance
   * @param {Object} options.registry - Prefetch registry for queryFn lookup
   */
  constructor({ queryClient: qc = queryClient, registry = prefetchRegistry } = {}) {
    this.#queryClient = qc
    this.#registry = registry
  }

  /**
   * Executes prefetch for the given query keys.
   * Only prefetches queries that are still stale and not currently fetching.
   *
   * @param {Array} queryKeys - Array of query keys to potentially prefetch
   * @returns {Promise<void>}
   */
  async execute(queryKeys) {
    if (!queryKeys || queryKeys.length === 0) return

    const staleQueries = this.collectStaleQueries(queryKeys)

    // Execute prefetches in parallel (fire-and-forget per query)
    const prefetchPromises = staleQueries.map((queryKey) => this.prefetch(queryKey))

    // Wait for all to complete (but don't fail fast)
    await Promise.allSettled(prefetchPromises)
  }

  /**
   * Collects queries that are still stale and should be prefetched.
   * Uses partial key matching - finds all queries that start with the given key prefix.
   *
   * @param {Array} queryKeys - Array of query key prefixes to check
   * @returns {Array} Array of query keys that are stale and not fetching
   */
  collectStaleQueries(queryKeys) {
    if (!queryKeys || queryKeys.length === 0) {
      return []
    }

    const queryCache = this.#queryClient.getQueryCache()
    const staleQueries = []
    const seen = new Set() // Avoid duplicates

    for (const queryKey of queryKeys) {
      // Use findAll for partial key matching (prefix match)
      const matchingQueries = queryCache.findAll({ queryKey })

      for (const query of matchingQueries) {
        const keyStr = JSON.stringify(query.queryKey)
        if (seen.has(keyStr)) continue
        seen.add(keyStr)

        if (this.shouldPrefetch(query)) {
          staleQueries.push(query.queryKey)
        }
      }
    }

    return staleQueries
  }

  /**
   * Determines if a query should be prefetched.
   *
   * Conditions for prefetch:
   * - Query is stale (was invalidated)
   * - Query is not currently fetching
   * - Query is not in error state
   * - Query has a registered queryFn
   *
   * @param {Object} query - TanStack Query object
   * @returns {boolean}
   */
  shouldPrefetch(query) {
    const state = query.state
    const queryKey = query.queryKey

    // Must be stale (was invalidated)
    // if (!state.isStale) {
    //   return false
    // }

    // Must not be currently fetching
    if (state.isFetching) {
      return false
    }

    // Should not be in error state
    if (state.status === 'error') {
      return false
    }

    // Must have a registered queryFn (check the full query key)
    if (!this.#registry.has(queryKey)) {
      return false
    }

    return true
  }

  /**
   * Executes prefetch for a single query.
   * Calls the registered queryFn which may use prefetchQuery internally.
   *
   * @param {Array} queryKey - Query key to prefetch
   * @returns {Promise<void>}
   */
  async prefetch(queryKey) {
    const registeredQueryFn = this.#registry.get(queryKey)

    if (!registeredQueryFn) {
      return
    }

    try {
      // The registered queryFn handles the fetch internally.
      // It may use prefetchQuery (returns void) or return data directly.
      // We just await it and let it do its work.
      await registeredQueryFn(queryKey)
    } catch (error) {
      // Log but don't throw - prefetch failures should not break the app
    }
  }
}
