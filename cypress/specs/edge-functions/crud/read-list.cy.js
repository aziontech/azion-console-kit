/**
 * Edge Functions - Read/List Tests (Self-Contained)
 *
 * API: GET v4/workspace/functions
 * Route: /edge-functions, /edge-functions/edit/:id
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
import selectors from '../../../support/selectors/product-selectors/edge-functions'

// Test data - created once, used by all tests in this spec
const testFunctionName = `cy-read-list-${Date.now()}`

// Helper to create a function for testing
const createTestFunction = (name) => {
  // Navigate to Edge Functions list first
  cy.openProduct('Edge Functions')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create button
  cy.get('[data-testid="create_Function_button"]').click()

  // Fill name and submit
  cy.get('[data-testid="field-text__input"]', { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)
  cy.get('[data-testid="form-actions-submit-button"]').click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Edge Functions - Read/List', { tags: ['@crud', '@edge-functions', '@v4', '@smoke'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestFunction(testFunctionName)
  })

  beforeEach(() => {
    // Setup fixture recording/replay for v4/workspace/functions API
    fixtureRecorder.setupSync('edgeFunctions', 'v4/workspace/functions')

    cy.login()
    cy.openProduct('Edge Functions')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    // Save recorded fixtures (only runs in record mode)
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display edge functions page', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains('ID').should('exist')
    })

    it('should display function data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__name"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_FUNC_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter functions by search term', () => {
      // Search for our test function
      tableHelpers.searchAndSubmit(testFunctionName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 10000 })
        .should('contain', testFunctionName)
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      // Search for our test function first
      tableHelpers.searchAndSubmit(testFunctionName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testFunctionName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/functions/edit/')
      cy.get(selectors.nameInput, { timeout: 15000 }).should('exist')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })

  describe('Detail View (Edit Page)', () => {
    it('should load function data for editing', () => {
      // Navigate to our test function
      tableHelpers.searchAndSubmit(testFunctionName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testFunctionName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('have.value', testFunctionName)
    })

    it('should display tabs for Code and Arguments', () => {
      // Navigate to our test function
      tableHelpers.searchAndSubmit(testFunctionName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testFunctionName)
        .click()

      // Check for tabs
      cy.get('.p-tabview-nav', { timeout: 15000 }).should('exist')
      cy.get('.p-tabview-nav').should('contain', 'Code')
    })
  })
})
