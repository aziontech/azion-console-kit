/**
 * Table Helpers
 *
 * Console-kit table patterns:
 * - Lazy loading with virtual scrolling
 * - Server-side pagination
 * - Search debounce (500ms)
 * - Column sorting
 * - Row actions menu
 */

export const tableHelpers = {
  /**
   * Waits for table to fully load including lazy-loaded data.
   * Checks for absence of loading indicators and presence of table body.
   *
   * @param {string} tableSelector - Custom table selector (default uses data-table)
   * @param {number} timeout - Max wait time in ms (default 10000)
   */
  waitForTableLoad(tableSelector = '.p-datatable', timeout = 10000) {
    // Wait for table container to be visible (fallback to .p-datatable which exists in all modules)
    cy.get(tableSelector, { timeout }).should('exist')

    // Wait for skeleton/spinner to disappear (if they exist)
    cy.get('body').then(($body) => {
      if ($body.find('.p-datatable-loading-overlay').length) {
        cy.get('.p-datatable-loading-overlay', { timeout }).should('not.exist')
      }
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout }).should('not.exist')
      }
    })
  },

  /**
   * Waits for search debounce to complete.
   * Console-kit uses 500ms debounce on search inputs.
   */
  waitForSearchDebounce() {
    cy.wait(600) // 500ms debounce + buffer
  },

  /**
   * Performs a search and waits for results.
   *
   * @param {string} searchTerm - Text to search for
   * @param {string} interceptAlias - Optional alias to wait for (e.g., '@listVariables')
   */
  search(searchTerm, interceptAlias = null) {
    const searchInput = '[data-testid="data-table-search-input"]'

    cy.get(searchInput).clear()
    cy.get(searchInput).type(searchTerm)

    this.waitForSearchDebounce()

    if (interceptAlias) {
      cy.wait(interceptAlias)
    }

    this.waitForTableLoad()
  },

  /**
   * Searches and presses Enter to submit.
   *
   * @param {string} searchTerm - Text to search for
   * @param {string} interceptAlias - Optional alias to wait for
   */
  searchAndSubmit(searchTerm, interceptAlias = null) {
    const searchInput = '[data-testid="data-table-search-input"]'

    cy.get(searchInput).clear()
    cy.get(searchInput).type(`${searchTerm}{enter}`)

    if (interceptAlias) {
      cy.wait(interceptAlias)
    }

    this.waitForTableLoad()
  },

  /**
   * Navigates to a specific page in the table.
   *
   * @param {number} pageNumber - Page number to navigate to
   * @param {string} interceptAlias - Optional alias to wait for data refresh
   */
  goToPage(pageNumber, interceptAlias = null) {
    const pageSelector = `button.p-paginator-page[aria-label="${pageNumber}"]`

    cy.get(pageSelector).click()

    if (interceptAlias) {
      cy.wait(interceptAlias)
    }

    this.waitForTableLoad()
  },

  /**
   * Changes the number of rows displayed per page.
   *
   * @param {number} rowsPerPage - Number of rows (10, 20, 50, etc.)
   * @param {string} interceptAlias - Optional alias to wait for data refresh
   */
  setRowsPerPage(rowsPerPage, interceptAlias = null) {
    cy.get('.p-paginator-rpp-options').click()
    cy.get(`li.p-dropdown-item[aria-label="${rowsPerPage}"]`).click()

    if (interceptAlias) {
      cy.wait(interceptAlias)
    }

    this.waitForTableLoad()
  },

  /**
   * Clicks on a table row to open details/edit.
   * Uses the name column as click target since PrimeVue rows don't have consistent selectors.
   *
   * @param {number} rowIndex - Zero-based row index
   */
  clickRow(rowIndex = 0) {
    // Click on the name column of the specified row
    cy.get('[data-testid="list-table-block__column__name__row"]').eq(rowIndex).click()
  },

  /**
   * Opens the actions menu for a specific row.
   *
   * @param {number} rowIndex - Zero-based row index
   */
  openRowActionsMenu(rowIndex = 0) {
    cy.get('[data-testid="data-table-actions-column-body-actions-menu-button"]')
      .eq(rowIndex)
      .click()
  },

  /**
   * Clicks a specific action in the actions menu.
   *
   * @param {string} actionName - Action name (e.g., 'Delete', 'Edit')
   */
  clickRowAction(actionName) {
    cy.get(`[data-testid="data-table__actions-menu-item__${actionName}-button"]`).click()
  },

  /**
   * Gets the value of a specific cell.
   *
   * @param {string} columnName - Column name/key
   * @param {number} rowIndex - Zero-based row index
   * @returns {Cypress.Chainable} - Chainable containing the cell element
   */
  getCell(columnName, rowIndex = 0) {
    return cy
      .get(`[data-testid="list-table-block__column__${columnName}__row"]`)
      .eq(rowIndex)
  },

  /**
   * Asserts the table shows empty state.
   * Handles both internal empty message and external EmptyResultsBlock.
   */
  assertEmpty() {
    // Check for either internal empty message or EmptyResultsBlock text patterns
    cy.get('body').then(($body) => {
      const hasInternalEmpty = $body.find('[data-testid="list-table-block__empty-message__text"]').length
      const hasExternalEmpty = $body.find('.min-h-\\[300px\\]').length // EmptyResultsBlock pattern
      const hasEmptyText = $body.text().includes('No ') && $body.text().includes(' has been added')

      if (hasInternalEmpty) {
        cy.get('[data-testid="list-table-block__empty-message__text"]').should('be.visible')
      } else if (hasExternalEmpty || hasEmptyText) {
        // EmptyResultsBlock - verify the container exists
        cy.get('.min-h-\\[300px\\]').should('be.visible')
      } else {
        throw new Error('No empty state found')
      }
    })
  },

  /**
   * Checks if list is empty (both internal and external patterns).
   * Returns true if empty, false if has data.
   *
   * @returns {Cypress.Chainable<boolean>}
   */
  isListEmpty() {
    return cy.get('body').then(($body) => {
      // Internal empty message
      if ($body.find('[data-testid="list-table-block__empty-message__text"]').length) {
        return true
      }
      // External EmptyResultsBlock - check for "No X has been added" pattern
      if ($body.find('[data-testid="data-table-empty-content"]').length) {
        return true
      }
      // EmptyResultsBlock with min-h-[300px] class and no table
      if ($body.find('.min-h-\\[300px\\]').length && !$body.find('.p-datatable').length) {
        return true
      }
      // Check for .p-datatable-emptymessage
      if ($body.find('.p-datatable-emptymessage').length) {
        return true
      }
      return false
    })
  },

  /**
   * Waits for list to be ready (either with data or empty state).
   * Use this instead of waitForTableLoad when list might be empty.
   *
   * @param {number} timeout - Max wait time
   */
  waitForListReady(timeout = 30000) {
    // Wait for either:
    // 1. .p-datatable (table with potential data)
    // 2. [data-testid*="empty"] (internal empty)
    // 3. .min-h-\[300px\] (EmptyResultsBlock)
    cy.get('.p-datatable, [data-testid*="empty"], .min-h-\\[300px\\]', { timeout }).should('exist')

    // Also wait for skeletons to disappear
    cy.get('.p-skeleton', { timeout: 15000 }).should('not.exist')
  },

  /**
   * Asserts the table has a specific number of rows.
   *
   * @param {number} count - Expected row count
   */
  assertRowCount(count) {
    cy.get('[data-testid="list-table-block__column__name__row"]').should('have.length', count)
  },

  /**
   * Asserts a row contains specific text.
   *
   * @param {number} rowIndex - Zero-based row index
   * @param {string} text - Expected text
   */
  assertRowContains(rowIndex, text) {
    cy.get('[data-testid="list-table-block__column__name__row"]').eq(rowIndex).should('contain', text)
  },

  /**
   * Waits for lazy load to fetch more items (virtual scrolling).
   * Scrolls to bottom and waits for new items.
   *
   * @param {string} interceptAlias - Alias to wait for fetch
   */
  waitForLazyLoadMore(interceptAlias = null) {
    cy.get('.p-datatable-wrapper').scrollTo('bottom')

    if (interceptAlias) {
      cy.wait(interceptAlias)
    }

    cy.wait(500) // Allow DOM to update
  },

  /**
   * Sorts table by clicking column header.
   *
   * @param {string} columnName - Column header text or data attribute
   * @param {string} interceptAlias - Optional alias to wait for data refresh
   */
  sortByColumn(columnName, interceptAlias = null) {
    cy.get(`th`).contains(columnName).click()

    if (interceptAlias) {
      cy.wait(interceptAlias)
    }

    this.waitForTableLoad()
  }
}
