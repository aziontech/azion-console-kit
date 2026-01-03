/**
 * Cache Helpers
 *
 * Console-kit uses TanStack Query with these cache types:
 * - GLOBAL: 30 min stale, 1 day gc (general data)
 * - SENSITIVE: 3 min stale, 5 min gc (credentials, account)
 * - PAGE_LIST: 5 min stale, 5 min gc (paginated lists)
 *
 * Query Key Pattern: ['module', 'list'|'detail', ...params]
 * Invalidation: queryClient.removeQueries() after mutations
 * Persistence: IndexedDB with encryption for SENSITIVE
 */

export const cacheHelpers = {
  /**
   * Waits for cache invalidation after a mutation.
   * The console-kit invalidates cache via queryClient.removeQueries()
   * which triggers a refetch. We wait for the network request to complete.
   *
   * @param {string} alias - The cy.intercept alias to wait for (e.g., '@listVariables')
   * @param {number} timeout - Max wait time in ms (default 5000)
   */
  waitForCacheInvalidation(alias, timeout = 5000) {
    if (alias) {
      cy.wait(alias, { timeout })
    } else {
      // Fallback: wait for any pending requests to settle
      cy.wait(500)
    }
  },

  /**
   * Forces a data refresh by clearing persisted cache (IndexedDB).
   * Useful when API changes aren't reflected due to stale cache.
   */
  forceRefresh() {
    cy.window().then((win) => {
      // Clear TanStack Query persisted cache from IndexedDB
      if (win.indexedDB) {
        win.indexedDB.deleteDatabase('AZION_QUERY_CACHE_DB')
      }
    })
    // Reload the page to trigger fresh data fetch
    cy.reload()
  },

  /**
   * Clears only the IndexedDB cache without reloading.
   * Use when you want to clear cache but control reload timing.
   */
  clearPersistedCache() {
    cy.window().then((win) => {
      if (win.indexedDB) {
        win.indexedDB.deleteDatabase('AZION_QUERY_CACHE_DB')
      }
    })
  },

  /**
   * Waits for session prefetch to complete after login.
   * The console-kit prefetches critical data (account, teams, etc.) post-login.
   *
   * @param {number} timeout - Max wait time in ms (default 10000)
   */
  waitForSessionPrefetch(timeout = 10000) {
    // Wait for the session manager to complete prefetching
    // This is indicated by the absence of loading spinners
    cy.get('[data-testid="loading-spinner"]', { timeout }).should('not.exist')
    cy.get('.p-progress-spinner', { timeout }).should('not.exist')
  },

  /**
   * Asserts that data came from cache (no network request).
   * Checks that the intercepted request was not called.
   *
   * @param {string} alias - The cy.intercept alias
   */
  assertCacheHit(alias) {
    cy.get(alias).should('not.exist')
  },

  /**
   * Asserts that data came from network (cache miss).
   *
   * @param {string} alias - The cy.intercept alias
   */
  assertCacheMiss(alias) {
    cy.wait(alias)
  },

  /**
   * Sets up intercepts for common cache-related requests.
   * Call this in beforeEach to track cache behavior.
   *
   * @param {string} module - Module name (e.g., 'variables', 'edge-functions')
   */
  setupCacheIntercepts(module) {
    const baseUrls = {
      variables: '/v3/variables*',
      'edge-functions': '/v4/workspace/functions*',
      'edge-applications': '/v4/workspace/applications*',
      'edge-firewall': '/v4/workspace/firewalls*',
      domains: '/domains*',
      users: '/v4/iam/users*',
      teams: '/v4/iam/teams*',
      credentials: '/v4/workspace/storage/credentials*'
    }

    const url = baseUrls[module]
    if (url) {
      cy.intercept('GET', url).as(`list${capitalize(module)}`)
      cy.intercept('POST', url).as(`create${capitalize(module)}`)
      cy.intercept('PUT', `${url}/*`).as(`update${capitalize(module)}`)
      cy.intercept('PATCH', `${url}/*`).as(`patch${capitalize(module)}`)
      cy.intercept('DELETE', `${url}/*`).as(`delete${capitalize(module)}`)
    }
  }
}

/**
 * Capitalizes first letter of string
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, '')
}
