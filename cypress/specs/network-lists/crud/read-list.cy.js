/**
 * Network Lists - Read/List Tests (Self-Contained)
 *
 * API: GET v4/workspace/network_lists
 * Route: /network-lists, /network-lists/edit/:id
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
import selectors from '../../../support/selectors/product-selectors/network-lists'

// Test data - created once, used by all tests in this spec
const testListName = `cy-read-list-${Date.now()}`

// Helper to create a network list for testing
const createTestNetworkList = (name) => {
  // Navigate to Network Lists first
  cy.openProduct('Network Lists')
  cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

  // Click create button
  cy.get(selectors.createButton).click()

  // Fill name
  cy.get(selectors.nameInput, { timeout: 15000 })
    .should('be.visible')
    .clear()
    .type(name)

  // Fill ASN values (default type)
  cy.get(selectors.asnTextarea, { timeout: 10000 })
    .should('be.visible')
    .type('12345')

  // Submit
  cy.get(selectors.saveButton).click()
  cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')
}

describe('Network Lists - Read/List', { tags: ['@crud', '@network-lists', '@v4'] }, () => {
  before(() => {
    // Setup: Create test data once for all tests in this spec
    cy.login()
    createTestNetworkList(testListName)
  })

  beforeEach(() => {
    fixtureRecorder.setupSync('networkLists', 'v4/workspace/network_lists')
    cy.login()
    cy.openProduct('Network Lists')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('List View', () => {
    it('should display network lists page', () => {
      cy.get(selectors.createButton, { timeout: 15000 }).should('be.visible')
    })

    it('should display table with correct columns', () => {
      cy.get('th').contains('Name').should('exist')
      cy.get('th').contains(/Type|ID/i).should('exist')
    })

    it('should display list data in rows', () => {
      cy.get('[data-testid*="list-table-block__column__name"]').should('exist')
    })
  })

  describe('Search Functionality', () => {
    it('should have search input', () => {
      cy.get(selectors.searchInput, { timeout: 15000 }).should('exist')
    })

    it('should show no results for non-matching search', () => {
      tableHelpers.searchAndSubmit('NONEXISTENT_LIST_XYZ999')
      cy.get('[data-testid*="empty"], .p-datatable-emptymessage', { timeout: 10000 })
        .should('exist')
    })

    it('should filter lists by search term', () => {
      // Search for our test list
      tableHelpers.searchAndSubmit(testListName)
      cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 10000 })
        .should('contain', testListName)
    })
  })

  describe('Table Interactions', () => {
    it('should navigate to edit page when clicking a row', () => {
      // Search for our test list first
      tableHelpers.searchAndSubmit(testListName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testListName)
        .click()

      cy.url({ timeout: 15000 }).should('include', '/network-lists/edit/')
      cy.get(selectors.nameInput, { timeout: 15000 }).should('exist')
    })

    it('should show action button for each row', () => {
      cy.get('[data-testid*="actions"]').should('exist')
    })
  })

  describe('Detail View (Edit Page)', () => {
    it('should load list data for editing', () => {
      // Navigate to our test list
      tableHelpers.searchAndSubmit(testListName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testListName)
        .click()

      cy.get(selectors.nameInput, { timeout: 15000 })
        .should('have.value', testListName)
    })

    it('should display ASN list textarea in edit form', () => {
      // Navigate to our test list (created as ASN type)
      tableHelpers.searchAndSubmit(testListName)
      cy.get('[data-testid*="list-table-block__column__name"]')
        .contains(testListName)
        .click()

      // ASN list should show the textarea with our test value
      cy.get(selectors.asnTextarea, { timeout: 15000 }).should('exist')
    })
  })
})
