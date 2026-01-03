/**
 * Navigation Helpers
 *
 * Console-kit navigation patterns:
 * - Prefetch on hover/focus
 * - Route guards for auth
 * - Breadcrumb tracking
 * - Sidebar/menu interactions
 */

export const navigationHelpers = {
  /**
   * Navigates to a route and waits for prefetch to complete.
   *
   * @param {string} route - Route path
   * @param {string} interceptAlias - Optional alias to wait for data load
   */
  navigateWithPrefetch(route, interceptAlias = null) {
    cy.visit(route)

    if (interceptAlias) {
      cy.wait(interceptAlias)
    }

    // Wait for page to be ready
    this.waitForRouteReady()
  },

  /**
   * Waits for route to be fully loaded (no spinners, content visible).
   *
   * @param {number} timeout - Max wait time (default 10000)
   */
  waitForRouteReady(timeout = 10000) {
    // Wait for loading indicators to disappear
    cy.get('[data-testid="loading-spinner"]', { timeout }).should('not.exist')
    cy.get('.p-progress-spinner', { timeout }).should('not.exist')

    // Wait for main content to be visible
    cy.get('main, [role="main"], .p-card', { timeout }).should('be.visible')
  },

  /**
   * Verifies the current breadcrumb trail.
   *
   * @param {string[]} expectedCrumbs - Array of expected breadcrumb texts in order
   */
  assertBreadcrumb(expectedCrumbs) {
    cy.get('.p-breadcrumb li, [data-testid*="breadcrumb"]').each(($crumb, index) => {
      if (expectedCrumbs[index]) {
        cy.wrap($crumb).should('contain', expectedCrumbs[index])
      }
    })
  },

  /**
   * Clicks a breadcrumb to navigate back.
   *
   * @param {string} crumbText - Text of the breadcrumb to click
   */
  clickBreadcrumb(crumbText) {
    cy.get('.p-breadcrumb li, [data-testid*="breadcrumb"]').contains(crumbText).click()
  },

  /**
   * Opens a product via sidebar navigation.
   *
   * @param {string} productName - Product name as shown in sidebar
   */
  openProductViaSidebar(productName) {
    const slugifiedName = productName.toLowerCase().replace(/ /g, '-')
    cy.get('[data-testid="sidebar__menu-item__toggle-button"]').click()
    cy.get(`[data-testid="sidebar__menu-item__${slugifiedName}"]`).click()
  },

  /**
   * Opens an item via account menu.
   *
   * @param {string} menuItem - Menu item label
   */
  openAccountMenuItem(menuItem) {
    cy.get('[data-testid="header-account-menu__avatar"]').click()
    cy.get('[role="menuitem"]').contains(menuItem).click()
  },

  /**
   * Waits for route guard to complete (auth check).
   *
   * @param {number} timeout - Max wait time (default 5000)
   */
  waitForRouteGuard(timeout = 5000) {
    // Route guard redirects to login if not authenticated
    cy.url({ timeout }).should('not.include', '/login')
  },

  /**
   * Asserts current URL matches expected route.
   *
   * @param {string} expectedRoute - Expected route path
   */
  assertRoute(expectedRoute) {
    cy.url().should('include', expectedRoute)
  },

  /**
   * Asserts URL contains query parameters.
   *
   * @param {Object} params - Expected query parameters
   */
  assertQueryParams(params) {
    cy.url().then((url) => {
      const searchParams = new URL(url).searchParams
      Object.entries(params).forEach(([key, value]) => {
        expect(searchParams.get(key)).to.equal(value)
      })
    })
  },

  /**
   * Navigates to create page for a module.
   *
   * @param {string} modulePath - Module path (e.g., 'variables', 'edge-functions')
   */
  goToCreatePage(modulePath) {
    cy.visit(`/${modulePath}/create`)
    this.waitForRouteReady()
  },

  /**
   * Navigates to edit page for a specific entity.
   *
   * @param {string} modulePath - Module path
   * @param {string|number} entityId - Entity ID
   */
  goToEditPage(modulePath, entityId) {
    cy.visit(`/${modulePath}/edit/${entityId}`)
    this.waitForRouteReady()
  },

  /**
   * Navigates to list page for a module.
   *
   * @param {string} modulePath - Module path
   */
  goToListPage(modulePath) {
    cy.visit(`/${modulePath}`)
    this.waitForRouteReady()
  },

  /**
   * Clicks the create button on a list page.
   *
   * @param {string} buttonTestId - Data-testid of create button
   */
  clickCreateButton(buttonTestId = null) {
    if (buttonTestId) {
      cy.get(`[data-testid="${buttonTestId}"]`).click()
    } else {
      cy.get('[data-testid*="create_"][data-testid*="_button"]').click()
    }
  },

  /**
   * Goes back using browser history.
   */
  goBack() {
    cy.go('back')
    this.waitForRouteReady()
  },

  /**
   * Refreshes the current page.
   */
  refresh() {
    cy.reload()
    this.waitForRouteReady()
  }
}
