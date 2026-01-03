/**
 * Personal Tokens - Read/List Tests (Self-Contained)
 *
 * API: GET v4/iam/personal_tokens
 * Route: /personal-tokens
 *
 * Self-contained: Creates test data in before(), tests against it.
 * No cleanup needed - CI handles it or data can be reused.
 *
 * Supports fixture recording:
 * - CYPRESS_TEST_MODE=record: Records API responses to fixtures
 * - CYPRESS_TEST_MODE=replay: Uses recorded fixtures
 * - CYPRESS_TEST_MODE=live: Uses real API (default)
 */

import { tableHelpers, fixtureRecorder } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/personal-tokens'

// Test data - created once, used by all tests in this spec
const testTokenName = `cy-read-list-${Date.now()}`

// Helper to create a personal token for testing
const createTestToken = (name) => {
  // Navigate to Personal Tokens page
  cy.visit('/personal-tokens')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create button
  cy.get(selectors.createTokenButton).click()

  // Fill name
  cy.get(selectors.tokenName, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Select expiration (use dropdown if available)
  cy.get('body').then(($body) => {
    if ($body.find(selectors.dropdownExpiration).length) {
      cy.get(selectors.dropdownExpiration).click()
      cy.get('[role="listbox"] [role="option"]', { timeout: 5000 }).first().click()
    }
  })

  // Submit
  cy.get(selectors.submitButton).click()

  // Wait for success - personal tokens show a copy dialog
  cy.get(selectors.copyTokenDialogHeader, { timeout: 30000 }).should('be.visible')

  // Close the copy dialog
  cy.get(selectors.closeCopyDialogButton).click()
}

describe('Personal Tokens - Read/List', { tags: ['@crud', '@personal-tokens', '@v4'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestToken(testTokenName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('personalTokens', 'v4/iam/personal_tokens')
    cy.login()
    // Personal Token is under Your Settings submenu, navigate directly
    cy.visit('/personal-tokens')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display personal tokens page', () => {
      cy.get(selectors.createTokenButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains(/Expiration|Created|ID/i).should('exist')
    })

    it('should display token data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__name"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_TOKEN_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter tokens by search term', () => {
      // Search for our test token
      tableHelpers.searchAndSubmit(testTokenName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 10000 })
        .should('contain', testTokenName)
    })
  })

  describe('Table Interactions', () => {
    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })

    it('should display delete action in menu', () => {
      tableHelpers.searchAndSubmit(testTokenName)
      cy.get(selectors.filteredRecordMenuButton).first().click()
      cy.get('[role="menuitem"]').contains(/delete/i).should('exist')
      cy.get('body').click(0, 0)
    })
  })
})
